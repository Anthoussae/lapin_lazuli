import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { setPhase } from '../../reducers/reduceGame'
import { shuffleDiscardIntoDrawIfNeeded, shuffleDrawPile } from './zones'
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

/** Finishes player defeat FX and transitions to the defeat screen. */
export function completePlayerDefeat(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat?.playerDefeatPending || state.player.hp > 0) return { state, events: [] }

  const resetExhausted = (s: GameState): GameState => {
    const deck = s.player.deck
    const nextById = Object.fromEntries(
      Object.entries(deck.cardById).map(([id, c]) => [id, { ...c, exhausted: false }]),
    )
    return { ...s, player: { ...s.player, deck: { ...deck, cardById: nextById } } }
  }

  const shuffled = shuffleAllZonesIntoDeck(resetExhausted(state))
  const base = shuffled.state
  const phaseInEvents: GameEvent[] = shuffled.phasedIn.map((id) => ({ type: 'EVT/CARD_PHASED_IN', cardInstanceId: id as any }))
  const cleared = { ...base, player: { ...base.player, shield: 0, lockedShield: 0 } }
  const s2 = setPhase(
    {
      ...cleared,
      defeat: cleared.defeat ?? { enemyName: 'Unknown enemy', level: cleared.level },
    },
    'DEFEAT',
  )

  return {
    state: clearActiveCombat(s2),
    events: [...phaseInEvents, { type: 'EVT/COMBAT_ENDED', result: 'DEFEAT' }],
  }
}
