import type { GameState } from '../../core/types/state'

/** Clears active combat (including turn-start bunny drain state) when a fight ends. */
export function clearActiveCombat(state: GameState): GameState {
  if (!state.combat && state.currentCombatPathId === null) return state
  return {
    ...state,
    combat: null,
    currentCombatPathId: null,
    player: { ...state.player, bunnies: 0 },
  }
}
