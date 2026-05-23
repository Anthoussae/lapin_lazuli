import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { setPhase } from '../../reducers/reduceGame'
import { shuffleDiscardIntoDrawIfNeeded, shuffleDrawPile } from './zones'
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

  const base = shuffleAllZonesIntoDeck(resetExhausted(state))
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
    events: [{ type: 'EVT/COMBAT_ENDED', result: 'DEFEAT' }],
  }
}
