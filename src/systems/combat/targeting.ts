import type { GameState } from '../../core/types/state'
import type { EnemyInstanceId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'

export function selectTarget(state: GameState, enemyId: EnemyInstanceId | null): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }
  if (enemyId !== null && !state.combat.enemies.enemyById[enemyId]) return { state, events: [] }
  const s2: GameState = {
    ...state,
    combat: { ...state.combat, targeting: { ...state.combat.targeting, selectedEnemyId: enemyId } },
  }
  return { state: s2, events: [] }
}

