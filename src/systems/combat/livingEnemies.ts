import type { EnemyInstanceId } from '../../core/types/ids'
import type { CombatState } from '../../core/types/state'

/** Enemies still fighting (hp > 0). Defeated enemies may stay in `aliveIds` during defeat FX. */
export function livingEnemyIds(combat: CombatState): ReadonlyArray<EnemyInstanceId> {
  return combat.enemies.aliveIds.filter((id) => (combat.enemies.enemyById[id]?.hp ?? 0) > 0)
}

export function livingEnemyCount(combat: CombatState): number {
  return livingEnemyIds(combat).length
}
