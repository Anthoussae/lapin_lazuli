import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import type { PathId } from '../../core/types/ids'
import { Paths, pathVictoryOffersRelicPick } from '../../data/paths'
import { Relics } from '../../data/relics'
import { setPhase } from '../../reducers/reduceGame'
import { shuffleDiscardIntoDrawIfNeeded, shuffleDrawPile } from './zones'
import { Enemies } from '../../data/enemies'
import { rollDice } from '../../core/rng/dice'
import { rngNext } from '../../core/rng/rng'
import { applyRelicEffect } from '../relics/applyRelicEffects'
import { applyCombatEndRelicTriggers, applyMinibossDefeatedRelicTriggers } from '../relics/triggers'
import { populateCardReward } from '../rewards/cardRewards'
import { initialRewardLootFlags } from '../rewards/rewardLoot'
import { pickThreeShopRelics } from '../shop/populateShop'
import { clearActiveCombat } from './endCombat'
import { purgeCombatEphemeralCards } from './purgeEphemeralCards'

function shuffleAllZonesIntoDeck(state: GameState): { state: GameState; phasedIn: ReadonlyArray<string> } {
  const purged = purgeCombatEphemeralCards(state)
  const deck0 = purged.player.deck
  const phasedOut = purged.combat?.phasedOut ?? []
  const merged = [...deck0.drawPile, ...deck0.discardPile, ...deck0.hand, ...phasedOut]
  let s: GameState = {
    ...purged,
    player: { ...purged.player, deck: { ...deck0, drawPile: merged, discardPile: [], hand: [] } },
  }
  s = shuffleDiscardIntoDrawIfNeeded(s)
  s = shuffleDrawPile(s)
  return { state: s, phasedIn: phasedOut }
}

function resetExhausted(state: GameState): GameState {
  const deck = state.player.deck
  const nextById = Object.fromEntries(
    Object.entries(deck.cardById).map(([id, c]) => [id, { ...c, exhausted: false, disabled: false }]),
  )
  return { ...state, player: { ...state.player, deck: { ...deck, cardById: nextById } } }
}

function combatKeyChance(pathId: PathId | null, luck: number): number {
  if (!pathId) return 0
  const curve = Paths[pathId]?.postVictoryKeyChance
  if (!curve) return 0
  const pct = curve.basePct + luck * curve.perLuck
  return Math.min(1, Math.max(0, pct / 100))
}

/** Flat gold added on top of dice + luck by combat path tier. */
function victoryGoldFlatBonus(pathId: PathId | null): number {
  switch (pathId) {
    case 'MEDIUM_ENEMY':
      return 7
    case 'HARD_ENEMY':
      return 10
    case 'EASY_ENEMY':
      return 5
    default:
      return 0
  }
}

/** Post-combat gold: Nd6 + luck × multiplier by combat path tier. */
function victoryGoldDiceAndLuck(pathId: PathId | null): Readonly<{ diceCount: number; luckMultiplier: number }> {
  switch (pathId) {
    case 'MEDIUM_ENEMY':
      return { diceCount: 2, luckMultiplier: 1 }
    case 'HARD_ENEMY':
      return { diceCount: 3, luckMultiplier: 1 }
    case 'MINIBOSS':
      return { diceCount: 5, luckMultiplier: 2 }
    case 'BOSS':
      return { diceCount: 10, luckMultiplier: 3 }
    case 'EASY_ENEMY':
    default:
      return { diceCount: 1, luckMultiplier: 1 }
  }
}

function computeVictoryGoldAndKeys(
  rngIn: GameState['rng'],
  entryPathId: PathId | null,
  luck: number,
  isRelicRewardFight: boolean,
): { rng: GameState['rng']; goldGain: number; keysEarned: number } {
  let rng = rngIn

  const { diceCount, luckMultiplier } = victoryGoldDiceAndLuck(entryPathId)
  const [rGold, diceTotal] = rollDice(rng, { count: diceCount, sides: 6 })
  rng = rGold
  const gold = diceTotal + luck * luckMultiplier + victoryGoldFlatBonus(entryPathId)

  let keysEarned: number
  if (isRelicRewardFight) {
    keysEarned = 1
  } else {
    const keyChance = combatKeyChance(entryPathId, luck)
    const [rKey, uKey] = rngNext(rng)
    rng = rKey
    keysEarned = uKey < keyChance ? 1 : 0
  }

  return { rng, goldGain: gold, keysEarned }
}

/** Applies post-combat victory rewards and phase transition (REWARD or GAME_WIN). */
export function applyCombatVictory(state: GameState): { state: GameState; events: GameEvent[] } {
  if (state.phase === 'REWARD' && state.cardReward) return { state, events: [] }
  if (state.phase === 'GAME_WIN') return { state, events: [] }

  const combatSnapshot = state.combat
  if (!combatSnapshot) return { state, events: [] }

  const entryPathId = state.currentCombatPathId ?? combatSnapshot.combatEntryPathId
  const isFinalBossVictory = Object.values(combatSnapshot.enemies.enemyById).some(
    (enemy) => Enemies[enemy.templateId]?.gameWinOnVictory,
  )
  const isRelicRewardFight = pathVictoryOffersRelicPick(entryPathId)

  const level =
    Object.values(combatSnapshot.enemies.enemyById)
      .map((e) => Enemies[e.templateId]?.level ?? 0)
      .reduce((a, b) => Math.max(a, b), 0) || 1

  let sTrig: GameState = resetExhausted(state)
  const relicEvents: GameEvent[] = []
  for (const rInst of sTrig.player.relics) {
    const rTmpl = Relics[rInst.templateId]
    for (const trig of rTmpl.triggers) {
      if (trig.on !== 'enemy_defeated') continue
      sTrig = applyRelicEffect(sTrig, trig.effect)
    }
  }

  // Miniboss-only relic triggers (e.g. Orchid) fire on victory resolution for the MINIBOSS path.
  if (entryPathId === 'MINIBOSS') {
    const miniboss = applyMinibossDefeatedRelicTriggers(sTrig)
    sTrig = miniboss.state
    relicEvents.push(...miniboss.events)
  }

  const combatEnd = applyCombatEndRelicTriggers(sTrig)
  sTrig = combatEnd.state
  relicEvents.push(...combatEnd.events)

  const goldKeys = computeVictoryGoldAndKeys(sTrig.rng, entryPathId, sTrig.player.luck, isRelicRewardFight)
  const { goldGain, keysEarned } = goldKeys

  sTrig = {
    ...sTrig,
    rng: goldKeys.rng,
  }

  const shuffled = shuffleAllZonesIntoDeck(sTrig)
  let s2: GameState = shuffled.state
  const phaseInEvents: GameEvent[] = shuffled.phasedIn.map((id) => ({ type: 'EVT/CARD_PHASED_IN', cardInstanceId: id as any }))

  if (isFinalBossVictory) {
    const cleared = clearActiveCombat(s2)
    s2 = setPhase(
      {
        ...cleared,
        cardReward: null,
        player: { ...cleared.player, shield: 0, lockedShield: 0 },
      },
      'GAME_WIN',
    )
    return { state: s2, events: [...relicEvents, ...phaseInEvents, { type: 'EVT/COMBAT_ENDED', result: 'VICTORY' }] }
  }

  let nextRng = s2.rng
  let cardReward: NonNullable<GameState['cardReward']>
  const lootFlags = initialRewardLootFlags(goldGain, keysEarned)
  if (isRelicRewardFight) {
    const ownedRelics = new Set(s2.player.relics.map((r) => r.templateId))
    const relicPick = pickThreeShopRelics(nextRng, ownedRelics)
    nextRng = relicPick.rng
    cardReward = {
      kind: 'RELIC',
      offered: relicPick.relicIds,
      goldEarned: goldGain,
      keysEarned,
      goldPickedUp: lootFlags.goldPickedUp,
      keysPickedUp: lootFlags.keysPickedUp,
    }
  } else {
    const rewardOut = populateCardReward({ rng: nextRng, baseRewardLevel: level, luck: s2.player.luck, count: 3 })
    nextRng = rewardOut.rng
    cardReward = {
      kind: 'CARD',
      offered: rewardOut.offered,
      goldEarned: goldGain,
      keysEarned,
      goldPickedUp: lootFlags.goldPickedUp,
      keysPickedUp: lootFlags.keysPickedUp,
    }
  }

  const cleared = clearActiveCombat(s2)
  s2 = setPhase(
    {
      ...cleared,
      rng: nextRng,
      cardReward,
      player: { ...cleared.player, shield: 0, lockedShield: 0 },
    },
    'REWARD',
  )
  return { state: s2, events: [...relicEvents, ...phaseInEvents, { type: 'EVT/COMBAT_ENDED', result: 'VICTORY' }] }
}
