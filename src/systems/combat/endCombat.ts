import type { GameState } from '../../core/types/state'

/** Zero cauldron bunnies (including negative counts from Draining). */
export function resetCauldronBunnies(state: GameState): GameState {
  if (state.player.bunnies === 0) return state
  return { ...state, player: { ...state.player, bunnies: 0 } }
}

/** Clears active combat (pending bunny release, turn-start drain, etc.) and resets the cauldron. */
export function clearActiveCombat(state: GameState): GameState {
  const withoutCombat =
    state.combat === null && state.currentCombatPathId === null
      ? state
      : { ...state, combat: null, currentCombatPathId: null }
  return resetCauldronBunnies(withoutCombat)
}
