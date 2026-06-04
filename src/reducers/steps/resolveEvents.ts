import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../events'
import { setPhase } from '../reduceGame'
import { shuffleDiscardIntoDrawIfNeeded, shuffleDrawPile } from '../../systems/combat/zones'
import { applyCombatVictory } from '../../systems/combat/combatVictory'
import { livingEnemyCount } from '../../systems/combat/livingEnemies'
import { clearActiveCombat } from '../../systems/combat/endCombat'
import { purgeCombatEphemeralCards } from '../../systems/combat/purgeEphemeralCards'
import { Relics } from '../../data/relics'

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
      if (s.combat?.enemies.enemyById[evt.unit as any]) {
        s = { ...s, runStats: { ...s.runStats, enemiesDefeated: s.runStats.enemiesDefeated + 1 } }
      }
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
  const purged = purgeCombatEphemeralCards(state)
  const deck0 = purged.player.deck
  const merged = [...deck0.drawPile, ...deck0.discardPile, ...deck0.hand]
  let s: GameState = {
    ...purged,
    player: { ...purged.player, deck: { ...deck0, drawPile: merged, discardPile: [], hand: [] } },
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
    const nextById = Object.fromEntries(
      Object.entries(deck.cardById).map(([id, c]) => [id, { ...c, exhausted: false, disabled: false }]),
    )
    return { ...s, player: { ...s.player, deck: { ...deck, cardById: nextById } } }
  }
  if (state.player.hp <= 0) {
    if (state.combat.playerDefeatPending) {
      return { state, events: [] }
    }
    // If defeat screen already set (captures killer), keep it. Otherwise fall back to a generic defeat.
    const base = shuffleAllZonesIntoDeck(resetExhausted(state))
    const cleared = { ...base, player: { ...base.player, shield: 0, lockedShield: 0 } }
    const s2 =
      cleared.phase === 'DEFEAT'
        ? cleared
        : setPhase(
            {
              ...cleared,
              runStats: {
                ...cleared.runStats,
                maxLevelReached: Math.max(cleared.runStats.maxLevelReached, cleared.level),
              },
              defeat: cleared.defeat ?? { enemyName: 'Unknown enemy', level: cleared.level },
            },
            'DEFEAT',
          )
    return {
      state: clearActiveCombat(s2),
      events: [{ type: 'EVT/COMBAT_ENDED', result: 'DEFEAT' }],
    }
  }
  if (livingEnemyCount(state.combat) === 0) {
    if (state.combat.monsterDefeatPending) {
      return { state, events: [] }
    }
    return applyCombatVictory(state)
  }
  return { state, events: [] }
}

function resolveRelicTriggers(state: GameState, evt: GameEvent): { state: GameState; events: GameEvent[] } {
  // Placeholder: relic triggers will be reintroduced later.
  // Keep the loop to avoid unused import warnings and preserve the intent that relic triggers
  // are enumerated deterministically by relic order.
  for (const rInst of state.player.relics) void Relics[rInst.templateId]
  void evt
  return { state, events: [] }
}

