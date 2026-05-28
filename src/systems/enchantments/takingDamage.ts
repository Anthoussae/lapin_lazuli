import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnchantmentInstance, EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { Enchantments } from '../../data/enchantments'
import { boostFireDealDamage } from '../cards/firepower'
import { effectiveFirepower } from '../combat/combatBonuses'
import { applyPlayerDamageThroughShields } from '../combat/shieldDamage'

export type TakingDamageCause = 'DIRECT' | 'ENCHANTMENT_REFLECT'

export type TakingDamageSource =
  | Readonly<{ kind: 'PLAYER' }>
  | Readonly<{ kind: 'ENEMY'; enemyInstanceId: EnemyInstanceId }>

type TakingDamageTarget = TakingDamageSource

export function applyEnchantmentOnTakingDamage(
  state: GameState,
  args: Readonly<{
    target: TakingDamageTarget
    source: TakingDamageSource | null
    attemptedDamage: number
    cause: TakingDamageCause
  }>,
): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat) return { state, events: [] }
  if (args.attemptedDamage <= 0) return { state, events: [] }
  if (args.cause !== 'DIRECT') return { state, events: [] }
  if (!args.source) return { state, events: [] }

  const targetRef: EnchantmentTargetRef =
    args.target.kind === 'PLAYER' ? { kind: 'PLAYER' } : { kind: 'ENEMY', enemyInstanceId: args.target.enemyInstanceId }

  const relevant: EnchantmentInstance[] = combat.enchantments.filter((e) => sameTargetRef(e.target, targetRef))
  if (!relevant.length) return { state, events: [] }

  let s = state
  const events: GameEvent[] = []

  for (const inst of relevant) {
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'TRIGGERED') continue
    if (tmpl.ability.trigger !== 'onTakingDamage') continue

    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'DEAL_DAMAGE') continue
      let amt = inst.amountOverride ?? fx.amount
      if (tmpl.tags.includes('fire')) {
        amt = boostFireDealDamage(amt, effectiveFirepower(s), s.player.firepowerMultiplier)
      }
      if (amt <= 0) continue

      if (args.source.kind === 'ENEMY') {
        const out = damageEnemyDirect(s, args.source.enemyInstanceId, amt)
        s = out.state
        events.push(...out.events)
      } else if (args.source.kind === 'PLAYER') {
        const { shield: nextSh, lockedShield: nextLockedSh, hp: nextHp } = applyPlayerDamageThroughShields(
          s.player.shield,
          s.player.lockedShield,
          s.player.hp,
          amt,
        )
        const died = s.player.hp > 0 && nextHp <= 0
        s = { ...s, player: { ...s.player, shield: nextSh, lockedShield: nextLockedSh, hp: nextHp } }
        if (died) {
          const combat0 = s.combat
          if (combat0) s = { ...s, combat: { ...combat0, playerDefeatPending: true } }
          events.push({ type: 'EVT/UNIT_DIED', unit: 'PLAYER' })
        }
      }
    }
  }

  return { state: s, events }
}

function sameTargetRef(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

function damageEnemyDirect(
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
  if (died) events.push({ type: 'EVT/UNIT_DIED', unit: enemyId })

  return {
    state: {
      ...state,
      combat: {
        ...combat,
        monsterDefeatPending: died ? enemyId : combat.monsterDefeatPending,
        enemies: {
          ...combat.enemies,
          enemyById: {
            ...combat.enemies.enemyById,
            [enemyId]: { ...enemy, shield: nextSh, lockedShield: nextLockedSh, hp: nextHp },
          },
        },
      },
    },
    events,
  }
}

