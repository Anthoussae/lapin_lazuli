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
import { populateCardReward } from '../rewards/cardRewards'
import { initialRewardLootFlags } from '../rewards/rewardLoot'
import { pickThreeShopRelics } from '../shop/populateShop'
import { clearActiveCombat } from './endCombat'

function shuffleAllZonesIntoDeck(state: GameState): GameState {
  const deck0 = state.player.deck
  const merged = [...deck0.drawPile, ...deck0.discardPile, ...deck0.hand]
  let s: GameState = {
    ...state,
    player: { ...state.player, deck: { ...deck0, drawPile: merged, discardPile: [], hand: [] } },
  }
  s = shuffleDiscardIntoDrawIfNeeded(s)
  s = shuffleDrawPile(s)
  return s
}

function resetExhausted(state: GameState): GameState {
  const deck = state.player.deck
  const nextById = Object.fromEntries(Object.entries(deck.cardById).map(([id, c]) => [id, { ...c, exhausted: false }]))
  return { ...state, player: { ...state.player, deck: { ...deck, cardById: nextById } } }
}

function combatKeyChance(pathId: PathId | null, luck: number): number {
  if (!pathId) return 0
  const curve = Paths[pathId]?.postVictoryKeyChance
  if (!curve) return 0
  const pct = curve.basePct + luck * curve.perLuck
  return Math.min(1, Math.max(0, pct / 100))
}

function computeVictoryGoldAndKeys(
  rngIn: GameState['rng'],
  combat: NonNullable<GameState['combat']>,
  level: number,
  entryPathId: PathId | null,
  luck: number,
  isRelicRewardFight: boolean,
): { rng: GameState['rng']; goldGain: number; keysEarned: number } {
  let rng = rngIn

  const [rBase, baseRoll] = rollDice(rng, { count: 1, sides: 4 })
  rng = rBase
  let gold = baseRoll * level

  for (const e of Object.values(combat.enemies.enemyById)) {
    for (let i = 0; i < e.boons.length; i++) {
      const [rB, bRoll] = rollDice(rng, { count: 1, sides: 4 })
      rng = rB
      gold += bRoll * level
    }
  }

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
  for (const rInst of sTrig.player.relics) {
    const rTmpl = Relics[rInst.templateId]
    for (const trig of rTmpl.triggers) {
      if (trig.on !== 'enemy_defeated') continue
      sTrig = applyRelicEffect(sTrig, trig.effect)
    }
  }

  const goldKeys = computeVictoryGoldAndKeys(
    sTrig.rng,
    combatSnapshot,
    level,
    entryPathId,
    sTrig.player.luck,
    isRelicRewardFight,
  )
  const { goldGain, keysEarned } = goldKeys

  sTrig = {
    ...sTrig,
    rng: goldKeys.rng,
  }

  let s2: GameState = shuffleAllZonesIntoDeck(sTrig)

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
    return { state: s2, events: [{ type: 'EVT/COMBAT_ENDED', result: 'VICTORY' }] }
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
  return { state: s2, events: [{ type: 'EVT/COMBAT_ENDED', result: 'VICTORY' }] }
}
