import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../../reducers/actions'

/** True while defeat FX, bunny release, or end-of-turn hand animations are in flight. */
export function isCombatResolvePending(state: GameState): boolean {
  const combat = state.combat
  if (!combat) return false
  return (
    !!combat.monsterDefeatPending ||
    !!combat.playerDefeatPending ||
    combat.bunnyReleasePending ||
    combat.pendingTurnStartDraw
  )
}

/** Player may play cards, retarget, or end turn (UI may add further presentation locks). */
export function canTakeCombatPlayerInput(state: GameState): boolean {
  if (state.phase !== 'COMBAT_PLAYER_READY') return false
  if (!state.combat) return false
  if (isCombatResolvePending(state)) return false
  return true
}

export function isCombatPlayerAction(action: PlayerAction): boolean {
  return action.type.startsWith('COMBAT/')
}

/** Drop combat intents once combat has ended so queued end-turn cannot run on the reward screen. */
export function pruneStaleCombatIntents(state: GameState): GameState {
  if (state.combat) return state
  const queued = state.ui.input.queued.filter((a) => !isCombatPlayerAction(a))
  if (queued.length === state.ui.input.queued.length) return state
  return { ...state, ui: { ...state.ui, input: { ...state.ui.input, queued } } }
}
