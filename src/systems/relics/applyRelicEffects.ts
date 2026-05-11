import type { GameState } from '../../core/types/state'
import type { Effect } from '../../data/effects'
import { normalizeBunnies } from '../bunnies'
import { upgradeSpecificCards } from '../cards/upgrades'

export function applyRelicEffect(state: GameState, fx: Effect): GameState {
  if (fx.kind === 'HEAL') {
    const nextHp = Math.min(state.player.maxHp, state.player.hp + fx.amount)
    return { ...state, player: { ...state.player, hp: nextHp } }
  }
  if (fx.kind === 'GAIN_SHIELD') {
    const target = fx.target ?? 'player'
    if (target !== 'player') return state
    return { ...state, player: { ...state.player, shield: state.player.shield + fx.amount } }
  }
  if (fx.kind === 'GAIN_LOCKED_SHIELD') {
    return { ...state, player: { ...state.player, lockedShield: state.player.lockedShield + fx.amount } }
  }
  if (fx.kind === 'GAIN_MAX_HP') {
    const nextMax = state.player.maxHp + fx.amount
    // Gaining max HP also heals that much missing HP (up to the new max).
    const nextHp = Math.min(nextMax, state.player.hp + fx.amount)
    return { ...state, player: { ...state.player, maxHp: nextMax, hp: nextHp } }
  }
  if (fx.kind === 'GAIN_GOLD') {
    return { ...state, player: { ...state.player, gold: state.player.gold + fx.amount } }
  }
  if (fx.kind === 'GAIN_KEYS') {
    return { ...state, player: { ...state.player, keys: state.player.keys + fx.amount } }
  }
  if (fx.kind === 'GAIN_POWER') {
    return { ...state, player: { ...state.player, power: state.player.power + fx.amount } }
  }
  if (fx.kind === 'GAIN_FIREPOWER_MULTIPLIER') {
    return {
      ...state,
      player: { ...state.player, firepowerMultiplier: state.player.firepowerMultiplier + fx.amount },
    }
  }
  if (fx.kind === 'GAIN_LUCK') {
    return { ...state, player: { ...state.player, luck: state.player.luck + fx.amount } }
  }
  if (fx.kind === 'GAIN_INK') {
    // Temporary: "ink" maps to current ink (energy) in MVP.
    return { ...state, player: { ...state.player, energy: state.player.energy + fx.amount } }
  }
  if (fx.kind === 'GAIN_MAX_INK') {
    // "max ink" maps to maxEnergy in MVP.
    const nextMax = state.player.maxEnergy + fx.amount
    return { ...state, player: { ...state.player, maxEnergy: nextMax } }
  }
  if (fx.kind === 'ADD_BUNNIES') {
    return {
      ...state,
      player: { ...state.player, bunnies: normalizeBunnies(state.player.bunnies + fx.amount) },
    }
  }
  if (fx.kind === 'MULTIPLY_BUNNIES') {
    return {
      ...state,
      player: { ...state.player, bunnies: normalizeBunnies(state.player.bunnies * fx.amount) },
    }
  }
  if (fx.kind === 'UPGRADE_SPECIFIC_CARD') {
    return upgradeSpecificCards(state, fx.target, fx.numberOfTargets, fx.upgradeAmount)
  }

  return state
}

