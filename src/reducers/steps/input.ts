import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../actions'

export function queueInputIntent(state: GameState, action: PlayerAction): GameState {
  return { ...state, ui: { ...state.ui, input: { ...state.ui.input, queued: [...state.ui.input.queued, action] } } }
}

export function flushInputIntents(state: GameState): GameState {
  return state
}

