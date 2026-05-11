import type { GameAction } from '../../reducers/actions'
import { initialState } from '../../reducers/initialState'
import { reduceGame } from '../../reducers/reduceGame'
import type { GameState } from '../types/state'

export type GameStore = Readonly<{
  getState: () => GameState
  dispatch: (action: GameAction) => void
  subscribe: (listener: () => void) => () => void
}>

export function createGameStore(): GameStore {
  let state: GameState = initialState()
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    dispatch: (action) => {
      state = reduceGame(state, action)
      for (const l of listeners) l()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
