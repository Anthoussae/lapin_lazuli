import type { GameState } from '../../core/types/state'
import { EnemyBoons } from '../../data/enemyBoons'

/** Bunnies lost at the start of each player turn from Draining (sum over alive enemies). */
export function combatPlayerTurnStartBunnyDrainFromAlive(state: GameState): number {
  const c = state.combat
  if (!c) return 0
  let total = 0
  for (const id of c.enemies.aliveIds) {
    const e = c.enemies.enemyById[id]
    if (!e || e.hp <= 0) continue
    for (const b of e.boons) total += EnemyBoons[b]?.playerTurnStartBunnyDrain ?? 0
  }
  return total
}

export function applyDrainingAtPlayerTurnStart(state: GameState): GameState {
  if (!state.combat) return state
  const drain = combatPlayerTurnStartBunnyDrainFromAlive(state) + state.combat.playerTurnStartBunnyDrain
  if (drain <= 0) return state
  return { ...state, player: { ...state.player, bunnies: state.player.bunnies - drain } }
}
