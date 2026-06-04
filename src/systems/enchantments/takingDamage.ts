import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnchantmentInstance, EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { Enchantments } from '../../data/enchantments'
import { displayFireDamage, powerDisplayContextFromState } from '../combat/powerDisplay'
import { applyIncomingDamageAndHpLossModifiers } from './incomingDamageModifiers'
import { applyOutgoingDamageAndHpLossModifiers } from './outgoingDamageReduction'
import { pushFireDamageReceivedEvent } from '../combat/fireDamageEvents'
import { applyPlayerDamageThroughShieldsMaybeBubble } from './bubble'

export type TakingDamageCause = 'DIRECT' | 'ENCHANTMENT_REFLECT' | 'BUNNY_RELEASE'

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
      const isFire = tmpl.tags.includes('fire')
      if (isFire) {
        amt = displayFireDamage(amt, powerDisplayContextFromState(s))
      }
      const reflectSource: TakingDamageSource =
        args.target.kind === 'PLAYER'
          ? { kind: 'PLAYER' }
          : { kind: 'ENEMY', enemyInstanceId: args.target.enemyInstanceId }
      amt = applyOutgoingDamageAndHpLossModifiers(s, reflectSource, amt)
      if (amt <= 0) continue

      if (args.source.kind === 'ENEMY') {
        const targetRef = { kind: 'ENEMY' as const, enemyInstanceId: args.source.enemyInstanceId }
        const resolved = applyIncomingDamageAndHpLossModifiers(s, targetRef, amt, isFire ? { damageType: 'FIRE' } : undefined)
        if (resolved <= 0) continue
        const combatBefore = s.combat
        const enemyBefore = combatBefore?.enemies.enemyById[args.source.enemyInstanceId]
        const out = damageEnemyDirect(s, args.source.enemyInstanceId, resolved)
        s = out.state
        events.push(...out.events)
        if (isFire && enemyBefore) {
          const enemyAfter = s.combat?.enemies.enemyById[args.source.enemyInstanceId]
          if (enemyAfter) {
            pushFireDamageReceivedEvent(
              events,
              args.source.enemyInstanceId,
              {
                hp: enemyBefore.hp,
                shield: enemyBefore.shield,
                lockedShield: enemyBefore.lockedShield,
              },
              {
                hp: enemyAfter.hp,
                shield: enemyAfter.shield,
                lockedShield: enemyAfter.lockedShield,
              },
            )
          }
        }
      } else if (args.source.kind === 'PLAYER') {
        const targetRef = { kind: 'PLAYER' as const }
        const resolved = applyIncomingDamageAndHpLossModifiers(s, targetRef, amt, isFire ? { damageType: 'FIRE' } : undefined)
        if (resolved <= 0) continue
        const before = {
          hp: s.player.hp,
          shield: s.player.shield,
          lockedShield: s.player.lockedShield,
        }
        const damageHit = applyPlayerDamageThroughShieldsMaybeBubble(
          s,
          { kind: 'PLAYER' },
          s.player.shield,
          s.player.lockedShield,
          s.player.hp,
          resolved,
        )
        s = damageHit.state
        const { shield: nextSh, lockedShield: nextLockedSh, hp: nextHp } = damageHit
        if (isFire) {
          pushFireDamageReceivedEvent(events, 'PLAYER', before, {
            hp: nextHp,
            shield: nextSh,
            lockedShield: nextLockedSh,
          })
        }
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

  const damageHit = applyPlayerDamageThroughShieldsMaybeBubble(
    state,
    { kind: 'ENEMY', enemyInstanceId: enemyId },
    enemy.shield,
    enemy.lockedShield,
    enemy.hp,
    damage,
  )
  const combatAfterBubble = damageHit.state.combat
  if (!combatAfterBubble) return { state: damageHit.state, events }
  const enemyAfterBubble = combatAfterBubble.enemies.enemyById[enemyId]
  if (!enemyAfterBubble) return { state: damageHit.state, events }

  const { shield: nextSh, lockedShield: nextLockedSh, hp: nextHp } = damageHit
  const died = enemy.hp > 0 && nextHp <= 0
  if (died) events.push({ type: 'EVT/UNIT_DIED', unit: enemyId })

  return {
    state: {
      ...damageHit.state,
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

