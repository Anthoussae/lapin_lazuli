import type { EnemyInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'

/** Removes all temporary and locked shield from one enemy. */
export function shatterEnemyShields(state: GameState, enemyId: EnemyInstanceId): GameState {
  const combat = state.combat
  if (!combat) return state
  const enemy = combat.enemies.enemyById[enemyId]
  if (!enemy || enemy.hp <= 0) return state
  if (enemy.shield <= 0 && enemy.lockedShield <= 0) return state
  return {
    ...state,
    combat: {
      ...combat,
      enemies: {
        ...combat.enemies,
        enemyById: {
          ...combat.enemies.enemyById,
          [enemyId]: { ...enemy, shield: 0, lockedShield: 0 },
        },
      },
    },
  }
}
