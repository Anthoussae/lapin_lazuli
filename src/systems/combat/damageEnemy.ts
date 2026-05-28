import type { EnemyInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { applyPlayerDamageThroughShields } from './shieldDamage'
import { applyEnchantmentOnTakingDamage, type TakingDamageCause, type TakingDamageSource } from '../enchantments/takingDamage'

export type DamageEnemyOptions = Readonly<{
  attacker: TakingDamageSource
  cause?: TakingDamageCause
}>

/** Applies damage to one enemy (shield first); emits {@link EVT/UNIT_DIED} when HP reaches 0. */
export function damageEnemy(
  state: GameState,
  enemyId: EnemyInstanceId,
  damage: number,
  opts?: DamageEnemyOptions,
): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  if (damage <= 0) return { state: s, events }

  const combat = s.combat
  if (!combat) return { state: s, events }

  const enemy = combat.enemies.enemyById[enemyId]
  if (!enemy || enemy.hp <= 0) return { state: s, events }

  const attacker: TakingDamageSource = opts?.attacker ?? { kind: 'PLAYER' }
  const cause: TakingDamageCause = opts?.cause ?? 'DIRECT'
  const ench = applyEnchantmentOnTakingDamage(s, {
    target: { kind: 'ENEMY', enemyInstanceId: enemyId },
    source: attacker,
    attemptedDamage: damage,
    cause,
  })
  s = ench.state
  events.push(...ench.events)

  const combatAfterEnch = s.combat
  if (!combatAfterEnch) return { state: s, events }
  const enemyAfterEnch = combatAfterEnch.enemies.enemyById[enemyId]
  if (!enemyAfterEnch || enemyAfterEnch.hp <= 0) return { state: s, events }

  const { shield: nextSh, lockedShield: nextLockedSh, hp: nextHp } = applyPlayerDamageThroughShields(
    enemyAfterEnch.shield,
    enemyAfterEnch.lockedShield,
    enemyAfterEnch.hp,
    damage,
  )
  const died = enemyAfterEnch.hp > 0 && nextHp <= 0
  const enemyById2 = {
    ...combatAfterEnch.enemies.enemyById,
    [enemyId]: { ...enemyAfterEnch, shield: nextSh, lockedShield: nextLockedSh, hp: nextHp },
  }
  if (died) events.push({ type: 'EVT/UNIT_DIED', unit: enemyId })

  return {
    state: {
      ...s,
      combat: {
        ...combatAfterEnch,
        monsterDefeatPending: died ? enemyId : combatAfterEnch.monsterDefeatPending,
        enemies: { ...combatAfterEnch.enemies, enemyById: enemyById2 },
      },
    },
    events,
  }
}
