import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnchantmentInstance } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import type { EnchantmentId } from '../../core/types/ids'
import { Enchantments } from '../../data/enchantments'
import { resolveShieldGainAmount } from '../cards/shieldPower'
import { addCombatPower, effectiveShieldPower } from '../combat/combatBonuses'
import { resolveEnchantmentPoisonHpLoss } from '../combat/powerDisplay'
import { shieldPowerPenaltyFromEnchantments } from './staticEffects'
import { applyIncomingDamageAndHpLossModifiers } from './incomingDamageModifiers'
import { applyOutgoingDamageAndHpLossModifiers, enchantmentOwnerAsDamageSource } from './outgoingDamageReduction'
import { applyHpLossMaybeBubble } from './bubble'

export function applyEnchantmentTurnStartForPlayer(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat) return { state, events: [] }
  const relevant = combat.enchantments.filter((e) => e.target.kind === 'PLAYER')
  return applyTurnStartForTarget(state, relevant)
}

export function applyEnchantmentTurnStartForEnemy(
  state: GameState,
  enemyInstanceId: EnemyInstanceId,
): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat) return { state, events: [] }
  const relevant = combat.enchantments.filter((e) => e.target.kind === 'ENEMY' && e.target.enemyInstanceId === enemyInstanceId)
  return applyTurnStartForTarget(state, relevant)
}

/** Clears temporary shield before turn-start enchantment triggers (locked shield is unchanged). */
export function drainEnemyTemporaryShieldAtTurnStart(
  state: GameState,
  enemyInstanceId: EnemyInstanceId,
): GameState {
  const combat = state.combat
  if (!combat) return state
  const enemy = combat.enemies.enemyById[enemyInstanceId]
  if (!enemy || enemy.shield <= 0) return state
  return {
    ...state,
    combat: {
      ...combat,
      enemies: {
        ...combat.enemies,
        enemyById: { ...combat.enemies.enemyById, [enemyInstanceId]: { ...enemy, shield: 0 } },
      },
    },
  }
}

/** Resolves onTargetTurnStart enchantments for all living enemies (after combat-start grants). */
export function applyCombatStartEnemyTurnStartEnchantments(
  state: GameState,
): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat) return { state, events: [] }
  let s = state
  const events: GameEvent[] = []
  for (const enemyId of combat.enemies.aliveIds) {
    const out = applyEnchantmentTurnStartForEnemy(s, enemyId)
    s = out.state
    events.push(...out.events)
  }
  return { state: s, events }
}

function applyTurnStartForTarget(
  state: GameState,
  instances: ReadonlyArray<EnchantmentInstance>,
): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []

  for (const inst of instances) {
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'TRIGGERED') continue
    if (tmpl.ability.trigger !== 'onTargetTurnStart') continue

    for (const fx of tmpl.ability.effects) {
      if (fx.kind === 'HP_LOSS') {
        let amt = inst.amountOverride ?? fx.amount
        const isPoison = tmpl.tags.includes('poison')
        amt = resolveEnchantmentPoisonHpLoss(amt, s, inst, isPoison)
        amt = applyOutgoingDamageAndHpLossModifiers(s, enchantmentOwnerAsDamageSource(inst.owner), amt)
        amt = applyIncomingDamageAndHpLossModifiers(s, inst.target, amt, isPoison ? { damageType: 'POISON' } : undefined)
        if (amt <= 0) continue
        if (inst.target.kind === 'PLAYER') {
          const loss = applyHpLossMaybeBubble(s, { kind: 'PLAYER' }, s.player.hp, amt)
          s = loss.state
          const nextHp = loss.nextHp
          const died = loss.lossApplied && s.player.hp > 0 && nextHp <= 0
          s = { ...s, player: { ...s.player, hp: nextHp } }
          if (isPoison && loss.lossApplied) {
            pushEnchantmentTriggeredEvent(events, 'POISON', 'PLAYER')
          }
          if (died) {
            const combat0 = s.combat
            if (combat0) s = { ...s, combat: { ...combat0, playerDefeatPending: true } }
            events.push({ type: 'EVT/UNIT_DIED', unit: 'PLAYER' })
          }
        } else if (inst.target.kind === 'ENEMY' && s.combat) {
          const e0 = s.combat.enemies.enemyById[inst.target.enemyInstanceId]
          if (!e0 || e0.hp <= 0) continue
          const loss = applyHpLossMaybeBubble(s, { kind: 'ENEMY', enemyInstanceId: e0.id }, e0.hp, amt)
          s = loss.state
          const combatAfterBubble = s.combat
          if (!combatAfterBubble) continue
          const enemyAfterBubble = combatAfterBubble.enemies.enemyById[e0.id]
          if (!enemyAfterBubble) continue
          const nextHp = loss.nextHp
          const died = loss.lossApplied && e0.hp > 0 && nextHp <= 0
          s = {
            ...s,
            combat: {
              ...combatAfterBubble,
              monsterDefeatPending: died ? e0.id : combatAfterBubble.monsterDefeatPending,
              enemies: {
                ...combatAfterBubble.enemies,
                enemyById: { ...combatAfterBubble.enemies.enemyById, [e0.id]: { ...enemyAfterBubble, hp: nextHp } },
              },
            },
          }
          if (isPoison && loss.lossApplied) {
            pushEnchantmentTriggeredEvent(events, 'POISON', e0.id)
          }
          if (died) events.push({ type: 'EVT/UNIT_DIED', unit: e0.id })
        }
      }
      if (fx.kind === 'GAIN_TEMPORARY_BUNNY_POWER') {
        const amt = inst.amountOverride ?? fx.amount
        if (amt <= 0 || inst.target.kind !== 'PLAYER') continue
        s = addCombatPower(s, amt)
        continue
      }
      if (fx.kind === 'GAIN_SHIELD') {
        let amt = inst.amountOverride ?? fx.amount
        const targetRef = inst.target
        const penalty = shieldPowerPenaltyFromEnchantments(s, targetRef)
        if (inst.target.kind === 'PLAYER') {
          amt = resolveShieldGainAmount(amt, effectiveShieldPower(s), penalty, true)
        } else if (inst.target.kind === 'ENEMY') {
          amt = resolveShieldGainAmount(amt, 0, penalty, false)
        }
        if (amt <= 0) continue

        if (inst.target.kind === 'PLAYER') {
          s = { ...s, player: { ...s.player, shield: s.player.shield + amt } }
        } else if (inst.target.kind === 'ENEMY' && s.combat) {
          const combat0 = s.combat
          const e0 = combat0.enemies.enemyById[inst.target.enemyInstanceId]
          if (!e0 || e0.hp <= 0) continue
          s = {
            ...s,
            combat: {
              ...combat0,
              enemies: {
                ...combat0.enemies,
                enemyById: {
                  ...combat0.enemies.enemyById,
                  [e0.id]: { ...e0, shield: e0.shield + amt },
                },
              },
            },
          }
        }
      }
    }
  }

  return { state: s, events }
}

function pushEnchantmentTriggeredEvent(
  events: GameEvent[],
  enchantmentId: EnchantmentId,
  unit: 'PLAYER' | EnemyInstanceId,
): void {
  events.push({ type: 'EVT/ENCHANTMENT_TRIGGERED', enchantmentId, unit })
}

