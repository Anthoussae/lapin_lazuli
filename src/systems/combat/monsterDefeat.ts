import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { applyCombatVictory } from './combatVictory'
import { livingEnemyCount } from './livingEnemies'

/** Finishes defeat FX: removes the enemy from the arena and resolves victory if none remain. */
export function completeMonsterDefeat(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  const pendingId = combat?.monsterDefeatPending
  if (!combat || !pendingId) return { state, events: [] }

  const aliveIds2 = combat.enemies.aliveIds.filter((id) => id !== pendingId)
  const s: GameState = {
    ...state,
    combat: {
      ...combat,
      monsterDefeatPending: null,
      enemies: { ...combat.enemies, aliveIds: aliveIds2 },
    },
  }

  const combatAfter = s.combat
  if (!combatAfter || livingEnemyCount(combatAfter) > 0) {
    return { state: s, events: [] }
  }

  return applyCombatVictory(s)
}
