import type { EnemyInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { applyPlayerDamageThroughShields } from './shieldDamage'

/** Applies damage to one enemy (shield first); emits {@link EVT/UNIT_DIED} when HP reaches 0. */
export function damageEnemy(
  state: GameState,
  enemyId: EnemyInstanceId,
  damage: number,
): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  if (damage <= 0) return { state, events }

  const combat = state.combat
  if (!combat) return { state, events }

  const enemy = combat.enemies.enemyById[enemyId]
  if (!enemy || enemy.hp <= 0) return { state, events }

  const { shield: nextSh, lockedShield: nextLockedSh, hp: nextHp } = applyPlayerDamageThroughShields(
    enemy.shield,
    enemy.lockedShield,
    enemy.hp,
    damage,
  )
  const died = enemy.hp > 0 && nextHp <= 0
  const enemyById2 = {
    ...combat.enemies.enemyById,
    [enemyId]: { ...enemy, shield: nextSh, lockedShield: nextLockedSh, hp: nextHp },
  }
  if (died) events.push({ type: 'EVT/UNIT_DIED', unit: enemyId })

  return {
    state: {
      ...state,
      combat: {
        ...combat,
        monsterDefeatPending: died ? enemyId : combat.monsterDefeatPending,
        enemies: { ...combat.enemies, enemyById: enemyById2 },
      },
    },
    events,
  }
}
