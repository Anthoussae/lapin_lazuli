import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../events'
import type { PathId } from '../../core/types/ids'
import { Relics } from '../../data/relics'
import { setPhase } from '../reduceGame'
import { shuffleDiscardIntoDrawIfNeeded, shuffleDrawPile } from '../../systems/combat/zones'
import { Enemies } from '../../data/enemies'
import { rollDice } from '../../core/rng/dice'
import { rngNext } from '../../core/rng/rng'
import { applyRelicEffect } from '../../systems/relics/applyRelicEffects'
import { populateCardReward } from '../../systems/rewards/cardRewards'
import { pickThreeShopRelics } from '../../systems/shop/populateShop'
import { clearActiveCombat } from '../../systems/combat/endCombat'

/** Key drop chance from combat path + luck; at most one key is rolled elsewhere. */
function combatKeyChance(pathId: PathId | null, luck: number): number {
  const L = luck
  let pct = 0
  if (pathId === 'EASY_ENEMY') pct = 10 + L * 2
  else if (pathId === 'MEDIUM_ENEMY') pct = 20 + L * 3
  else if (pathId === 'HARD_ENEMY' || pathId === 'MINIBOSS' || pathId === 'BOSS') pct = 30 + L * 4
  else return 0
  return Math.min(1, Math.max(0, pct / 100))
}

export function resolveEventQueue(state: GameState, eventsIn: ReadonlyArray<GameEvent>): { state: GameState; events: GameEvent[] } {
  let s = state
  const outEvents: GameEvent[] = []
  const queue: GameEvent[] = [...eventsIn]

  // Deterministic resolution: FIFO events, deterministic trigger enumeration by relic order.
  let safety = 0
  while (queue.length) {
    if (++safety > 500) break
    const evt = queue.shift()!

    // 1) Expand triggers from relics (buffs/enemies later).
    const derived = resolveRelicTriggers(s, evt)
    if (derived.state !== s) s = derived.state
    for (const e of derived.events) {
      outEvents.push(e)
      queue.push(e)
    }

    // 2) Check win/lose after deaths.
    if (evt.type === 'EVT/UNIT_DIED') {
      const ended = maybeEndCombat(s)
      if (ended.state !== s) s = ended.state
      for (const e of ended.events) {
        outEvents.push(e)
        queue.push(e)
      }
    }
  }

  return { state: s, events: outEvents }
}

function shuffleAllZonesIntoDeck(state: GameState): GameState {
  // End-of-combat cleanup: put everything back into the deck.
  // Includes: discard + hand (and any stray "last played" interactive card still in hand).
  const deck0 = state.player.deck
  const merged = [...deck0.drawPile, ...deck0.discardPile, ...deck0.hand]
  let s: GameState = {
    ...state,
    player: { ...state.player, deck: { ...deck0, drawPile: merged, discardPile: [], hand: [] } },
  }

  // If draw pile is empty, this will shuffle discard -> draw (noop here, but keeps behavior consistent).
  s = shuffleDiscardIntoDrawIfNeeded(s)
  s = shuffleDrawPile(s)
  return s
}

function maybeEndCombat(state: GameState): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }
  const resetExhausted = (s: GameState): GameState => {
    const deck = s.player.deck
    const nextById = Object.fromEntries(Object.entries(deck.cardById).map(([id, c]) => [id, { ...c, exhausted: false }]))
    return { ...s, player: { ...s.player, deck: { ...deck, cardById: nextById } } }
  }
  if (state.player.hp <= 0) {
    // If defeat screen already set (captures killer), keep it. Otherwise fall back to a generic defeat.
    const base = shuffleAllZonesIntoDeck(resetExhausted(state))
    const cleared = { ...base, player: { ...base.player, shield: 0, lockedShield: 0 } }
    const s2 =
      cleared.phase === 'DEFEAT'
        ? cleared
        : setPhase(
            {
              ...cleared,
              defeat: cleared.defeat ?? { enemyName: 'Unknown enemy', level: cleared.level },
            },
            'DEFEAT',
          )
    return {
      state: clearActiveCombat(s2),
      events: [{ type: 'EVT/COMBAT_ENDED', result: 'DEFEAT' }],
    }
  }
  if (state.combat.enemies.aliveIds.length === 0) {
    // Snapshot path and turn from the active combat before any state mutation (rewards use the path
    // from encounter start; `currentCombatPathId` is set in `startCombat` with the chosen path id).
    const combatSnapshot = state.combat
    const entryPathId = state.currentCombatPathId ?? combatSnapshot.combatEntryPathId
    const isFinalBossVictory = Object.values(combatSnapshot.enemies.enemyById).some(
      (enemy) => enemy.templateId === 'MISO_TYRANT',
    )
    const isRelicRewardFight = entryPathId === 'MINIBOSS' || entryPathId === 'BOSS'

    const level =
      Object.values(combatSnapshot.enemies.enemyById)
        .map((e) => Enemies[e.templateId]?.level ?? 0)
        .reduce((a, b) => Math.max(a, b), 0) || 1

    // Enemy defeated triggers (victory).
    let sTrig: GameState = resetExhausted(state)
    for (const rInst of sTrig.player.relics) {
      const rTmpl = Relics[rInst.templateId]
      for (const trig of rTmpl.triggers) {
        if (trig.on !== 'enemy_defeated') continue
        sTrig = applyRelicEffect(sTrig, trig.effect)
      }
    }

    // Gold/keys are calculated the same way for normal fights and minibosses:
    //   - Baseline: 1d4 × encounter level.
    //   - Each boon on any enemy adds an extra 1d4 × encounter level (rolled per boon; minibosses can have two).
    //   - Minibosses always grant 1 key.
    const goldKeys = computeVictoryGoldAndKeys(sTrig.rng, combatSnapshot, level, entryPathId, sTrig.player.luck, isRelicRewardFight)
    const { goldGain, keysEarned } = goldKeys

    sTrig = {
      ...sTrig,
      rng: goldKeys.rng,
      player: {
        ...sTrig.player,
        gold: sTrig.player.gold + goldGain,
        keys: sTrig.player.keys + keysEarned,
      },
    }

    let s2: GameState = shuffleAllZonesIntoDeck(sTrig)

    if (isFinalBossVictory) {
      s2 = setPhase(
        {
          ...clearActiveCombat(s2),
          cardReward: null,
          player: { ...s2.player, shield: 0, lockedShield: 0 },
        },
        'GAME_WIN',
      )
      return { state: s2, events: [{ type: 'EVT/COMBAT_ENDED', result: 'VICTORY' }] }
    }

    // The only thing that actually differs between normal and miniboss is the offer kind.
    let nextRng = s2.rng
    let cardReward: NonNullable<GameState['cardReward']>
    if (isRelicRewardFight) {
      const ownedRelics = new Set(s2.player.relics.map((r) => r.templateId))
      const relicPick = pickThreeShopRelics(nextRng, ownedRelics)
      nextRng = relicPick.rng
      cardReward = { kind: 'RELIC', offered: relicPick.relicIds, goldEarned: goldGain, keysEarned }
    } else {
      const rewardOut = populateCardReward({ rng: nextRng, baseRewardLevel: level, luck: s2.player.luck, count: 3 })
      nextRng = rewardOut.rng
      cardReward = { kind: 'CARD', offered: rewardOut.offered, goldEarned: goldGain, keysEarned }
    }

    s2 = setPhase(
      {
        ...clearActiveCombat(s2),
        rng: nextRng,
        cardReward,
        player: { ...s2.player, shield: 0, lockedShield: 0 },
      },
      'REWARD',
    )
    return { state: s2, events: [{ type: 'EVT/COMBAT_ENDED', result: 'VICTORY' }] }
  }
  return { state, events: [] }
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

  // Per-boon bonus: 1d4 × encounter level for every boon across all enemies in the encounter.
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

function resolveRelicTriggers(state: GameState, evt: GameEvent): { state: GameState; events: GameEvent[] } {
  // Placeholder: relic triggers will be reintroduced later.
  // Keep the loop to avoid unused import warnings and preserve the intent that relic triggers
  // are enumerated deterministically by relic order.
  for (const rInst of state.player.relics) void Relics[rInst.templateId]
  void evt
  return { state, events: [] }
}

