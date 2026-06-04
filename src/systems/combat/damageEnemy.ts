import type { IncomingDamageType } from '../../core/types/enchantments'
import type { EnemyInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { applyPlayerDamageThroughShieldsMaybeBubble } from '../enchantments/bubble'
import { applyIncomingDamageAndHpLossModifiers } from '../enchantments/incomingDamageModifiers'
import { applyOutgoingDamageAndHpLossModifiers } from '../enchantments/outgoingDamageReduction'
import { applyEnchantmentOnTakingDamage, type TakingDamageCause, type TakingDamageSource } from '../enchantments/takingDamage'
import { enemyDodgeChance, rollDodge } from './dodge'
import { pushFireDamageReceivedEvent } from './fireDamageEvents'

export type DamageEnemyOptions = Readonly<{
  attacker: TakingDamageSource
  cause?: TakingDamageCause
  /** When set, multiplicative incoming-damage resists apply after buffs. */
  incomingDamageType?: IncomingDamageType
  /** When true, enemy `dodgeChance` may negate this hit (fire spells, cauldron bunny release). */
  enemyMayDodge?: boolean
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
  const targetRef = { kind: 'ENEMY' as const, enemyInstanceId: enemyId }
  const damageType = opts?.incomingDamageType ?? (cause === 'BUNNY_RELEASE' ? 'BUNNY' : undefined)
  const afterOutgoing = applyOutgoingDamageAndHpLossModifiers(s, attacker, damage)
  const resolvedDamage = applyIncomingDamageAndHpLossModifiers(
    s,
    targetRef,
    afterOutgoing,
    damageType ? { damageType } : undefined,
  )
  if (resolvedDamage <= 0) return { state: s, events }

  const ench = applyEnchantmentOnTakingDamage(s, {
    target: targetRef,
    source: attacker,
    attemptedDamage: resolvedDamage,
    cause,
  })
  s = ench.state
  events.push(...ench.events)

  const combatAfterEnch = s.combat
  if (!combatAfterEnch) return { state: s, events }
  const enemyAfterEnch = combatAfterEnch.enemies.enemyById[enemyId]
  if (!enemyAfterEnch || enemyAfterEnch.hp <= 0) return { state: s, events }

  if (opts?.enemyMayDodge) {
    const dodgeRoll = rollDodge(s, enemyDodgeChance(enemyAfterEnch.templateId))
    s = dodgeRoll.state
    if (dodgeRoll.dodged) return { state: s, events }
  }

  const damageHit = applyPlayerDamageThroughShieldsMaybeBubble(
    s,
    { kind: 'ENEMY', enemyInstanceId: enemyId },
    enemyAfterEnch.shield,
    enemyAfterEnch.lockedShield,
    enemyAfterEnch.hp,
    resolvedDamage,
  )
  s = damageHit.state
  const combatAfterBubble = s.combat
  if (!combatAfterBubble) return { state: s, events }
  const enemyAfterBubble = combatAfterBubble.enemies.enemyById[enemyId]
  if (!enemyAfterBubble) return { state: s, events }

  const { shield: nextSh, lockedShield: nextLockedSh, hp: nextHp } = damageHit
  if (opts?.incomingDamageType === 'FIRE') {
    pushFireDamageReceivedEvent(
      events,
      enemyId,
      {
        hp: enemyAfterEnch.hp,
        shield: enemyAfterEnch.shield,
        lockedShield: enemyAfterEnch.lockedShield,
      },
      { hp: nextHp, shield: nextSh, lockedShield: nextLockedSh },
    )
  }
  const died = enemyAfterEnch.hp > 0 && nextHp <= 0
  if (died) events.push({ type: 'EVT/UNIT_DIED', unit: enemyId })

  return {
    state: {
      ...s,
      combat: {
        ...combatAfterBubble,
        monsterDefeatPending: died ? enemyId : combatAfterBubble.monsterDefeatPending,
        enemies: {
          ...combatAfterBubble.enemies,
          enemyById: {
            ...combatAfterBubble.enemies.enemyById,
            [enemyId]: { ...enemyAfterBubble, shield: nextSh, lockedShield: nextLockedSh, hp: nextHp },
          },
        },
      },
    },
    events,
  }
}
