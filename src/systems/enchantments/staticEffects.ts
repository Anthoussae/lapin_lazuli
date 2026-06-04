import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnchantmentInstance, EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { Enchantments } from '../../data/enchantments'

export function appliedPrimaryAmount(inst: EnchantmentInstance): number {
  const tmpl = Enchantments[inst.templateId]
  if (!tmpl) return inst.amountOverride ?? 0

  if (inst.amountOverride != null) return inst.amountOverride
  if (tmpl.ability.kind === 'STATIC') {
    const fx = tmpl.ability.effects[0]
    if (!fx) return 0
    if (fx.kind === 'REDUCE_INCOMING_DAMAGE' || fx.kind === 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS') return fx.percent
    if (fx.kind === 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS') return fx.percent
    return fx.amount ?? 0
  }
  if (tmpl.ability.kind === 'TRIGGERED') {
    const fx = tmpl.ability.effects[0]
    if (!fx) return 0
    if (fx.kind === 'REDUCE_INCOMING_DAMAGE' || fx.kind === 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS') return fx.percent
    if (fx.kind === 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS') return fx.percent
    return fx.amount ?? 0
  }
  return 0
}

export function applyStaticEnchantmentOnGain(state: GameState, inst: EnchantmentInstance): GameState {
  const tmpl = Enchantments[inst.templateId]
  if (!tmpl || tmpl.ability.kind !== 'STATIC') return state
  const amt = appliedPrimaryAmount(inst)
  if (amt === 0) return state

  for (const fx of tmpl.ability.effects) {
    if (fx.kind === 'GAIN_MAX_HP') {
      return applyMaxHpDelta(state, inst.target, +amt)
    }
  }
  return state
}

export function applyStaticEnchantmentOnRemove(state: GameState, inst: EnchantmentInstance): GameState {
  const tmpl = Enchantments[inst.templateId]
  if (!tmpl || tmpl.ability.kind !== 'STATIC') return state
  const amt = appliedPrimaryAmount(inst)
  if (amt === 0) return state

  for (const fx of tmpl.ability.effects) {
    if (fx.kind === 'GAIN_MAX_HP') {
      return applyMaxHpDelta(state, inst.target, -amt)
    }
  }
  return state
}

export function unwindAllCombatStaticEnchantments(state: GameState): GameState {
  const combat = state.combat
  if (!combat) return state
  let s = state
  for (const inst of combat.enchantments) {
    s = applyStaticEnchantmentOnRemove(s, inst)
  }
  return s
}

/** Sum of shield-gain penalties from static enchantments on a target (each stack applies once). */
export function shieldPowerPenaltyFromEnchantments(
  state: GameState,
  target: EnchantmentTargetRef,
): number {
  const combat = state.combat
  if (!combat) return 0
  let penalty = 0
  for (const inst of combat.enchantments) {
    if (inst.target.kind !== target.kind) continue
    if (
      target.kind === 'ENEMY' &&
      (inst.target.kind !== 'ENEMY' || inst.target.enemyInstanceId !== target.enemyInstanceId)
    ) {
      continue
    }
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'DECREASE_SHIELD_POWER') continue
      penalty += appliedPrimaryAmount(inst)
    }
  }
  return penalty
}

/** Sum of hand-draw penalties from static enchantments on the player (each stack applies once). */
export function combatHandDrawPenaltyFromEnchantments(state: GameState): number {
  const combat = state.combat
  if (!combat) return 0
  let penalty = 0
  for (const inst of combat.enchantments) {
    if (inst.target.kind !== 'PLAYER') continue
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'REDUCE_HAND_DRAW') continue
      penalty += appliedPrimaryAmount(inst)
    }
  }
  return penalty
}

function applyMaxHpDelta(state: GameState, target: EnchantmentTargetRef, delta: number): GameState {
  if (delta === 0) return state

  if (target.kind === 'PLAYER') {
    const nextMax = Math.max(0, state.player.maxHp + delta)
    const nextHp =
      delta > 0 ? Math.min(nextMax, state.player.hp + delta) : Math.min(state.player.hp, nextMax)
    let s: GameState = { ...state, player: { ...state.player, maxHp: nextMax, hp: nextHp } }
    if (nextHp <= 0) {
      const combat0 = s.combat
      if (combat0) s = { ...s, combat: { ...combat0, playerDefeatPending: true } }
    }
    return s
  }

  if (target.kind === 'ENEMY') {
    const combat0 = state.combat
    if (!combat0) return state
    const e0 = combat0.enemies.enemyById[target.enemyInstanceId]
    if (!e0) return state
    const nextMax = Math.max(0, e0.maxHp + delta)
    const nextHp = delta > 0 ? Math.min(nextMax, e0.hp + delta) : Math.min(e0.hp, nextMax)
    const died = e0.hp > 0 && nextHp <= 0
    const nextEnemy = { ...e0, maxHp: nextMax, hp: nextHp }
    return {
      ...state,
      combat: {
        ...combat0,
        monsterDefeatPending: died ? e0.id : combat0.monsterDefeatPending,
        enemies: { ...combat0.enemies, enemyById: { ...combat0.enemies.enemyById, [e0.id]: nextEnemy } },
      },
    }
  }

  return state
}

export type { EnemyInstanceId }
