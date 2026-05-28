import type { GameState } from '../../core/types/state'
import { unwindAllCombatStaticEnchantments } from '../enchantments/staticEffects'

/** Zero cauldron bunnies (including negative counts from Draining). */
export function resetCauldronBunnies(state: GameState): GameState {
  if (state.player.bunnies === 0) return state
  return { ...state, player: { ...state.player, bunnies: 0 } }
}

/** Clears active combat (pending bunny release, turn-start drain, etc.) and resets the cauldron. */
export function clearActiveCombat(state: GameState): GameState {
  const unwound = unwindAllCombatStaticEnchantments(state)
  const withoutCombat =
    unwound.combat === null && unwound.currentCombatPathId === null
      ? unwound
      : { ...unwound, combat: null, currentCombatPathId: null }
  return resetCauldronBunnies(withoutCombat)
}
