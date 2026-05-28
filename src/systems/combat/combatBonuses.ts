import type { CombatBonuses, GameState } from '../../core/types/state'
import { Enchantments } from '../../data/enchantments'

export const EMPTY_COMBAT_BONUSES: CombatBonuses = { power: 0, firepower: 0, shieldPower: 0 }

/** Permanent {@link PlayerState.power} plus combat-only bonuses (cleared when combat ends). */
export function effectivePower(state: GameState): number {
  const base = state.player.power
  const combatBonus = state.combat?.combatBonuses.power ?? 0
  const enchBonus = enchantmentPowerBonus(state)
  return base + combatBonus + enchBonus
}

/** Permanent {@link PlayerState.firepower} plus combat-only bonuses (cleared when combat ends). */
export function effectiveFirepower(state: GameState): number {
  const base = state.player.firepower
  const combatBonus = state.combat?.combatBonuses.firepower ?? 0
  const enchBonus = enchantmentFirepowerBonus(state)
  return base + combatBonus + enchBonus
}

/** Permanent {@link PlayerState.shieldPower} plus combat-only bonuses (cleared when combat ends). */
export function effectiveShieldPower(state: GameState): number {
  const base = state.player.shieldPower
  const combatBonus = state.combat?.combatBonuses.shieldPower ?? 0
  const enchBonus = enchantmentShieldPowerBonus(state)
  return base + combatBonus + enchBonus
}

function enchantmentShieldPowerBonus(state: GameState): number {
  const combat = state.combat
  if (!combat) return 0
  let total = 0
  for (const inst of combat.enchantments) {
    if (inst.target.kind !== 'PLAYER') continue
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'ADD_SHIELD_POWER') continue
      total += inst.amountOverride ?? fx.amount
    }
  }
  return total
}

function enchantmentPowerBonus(state: GameState): number {
  const combat = state.combat
  if (!combat) return 0
  let total = 0
  for (const inst of combat.enchantments) {
    if (inst.target.kind !== 'PLAYER') continue
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'ADD_POWER') continue
      total += inst.amountOverride ?? fx.amount
    }
  }
  return total
}

function enchantmentFirepowerBonus(state: GameState): number {
  const combat = state.combat
  if (!combat) return 0
  let total = 0
  for (const inst of combat.enchantments) {
    if (inst.target.kind !== 'PLAYER') continue
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'ADD_FIREPOWER') continue
      total += inst.amountOverride ?? fx.amount
    }
  }
  return total
}

export function addCombatPower(state: GameState, amount: number): GameState {
  const combat = state.combat
  if (!combat || amount === 0) return state
  return {
    ...state,
    combat: {
      ...combat,
      combatBonuses: {
        ...combat.combatBonuses,
        power: combat.combatBonuses.power + amount,
      },
    },
  }
}

export function addCombatFirepower(state: GameState, amount: number): GameState {
  const combat = state.combat
  if (!combat || amount === 0) return state
  return {
    ...state,
    combat: {
      ...combat,
      combatBonuses: {
        ...combat.combatBonuses,
        firepower: combat.combatBonuses.firepower + amount,
      },
    },
  }
}

export function addCombatShieldPower(state: GameState, amount: number): GameState {
  const combat = state.combat
  if (!combat || amount === 0) return state
  return {
    ...state,
    combat: {
      ...combat,
      combatBonuses: {
        ...combat.combatBonuses,
        shieldPower: combat.combatBonuses.shieldPower + amount,
      },
    },
  }
}
