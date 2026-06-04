import type { EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import type { CardInstanceId } from '../../core/types/ids'
import type { Effect } from '../../data/effects'
import { Enchantments } from '../../data/enchantments'
import { isBurdenCardId } from '../../data/cards'
import { multiplyBunnies, normalizeBunnies } from '../bunnies'
import { addRandomPotionToHand } from '../cards/potions'
import { upgradeCardInstance, upgradeRandomDeckCards, upgradeSpecificCards } from '../cards/upgrades'
import { addCombatFirepower, addCombatPower, addCombatShieldPower } from '../combat/combatBonuses'
import { resolveShieldGainAmount } from '../cards/shieldPower'
import { shieldPowerPenaltyFromEnchantments } from '../enchantments/staticEffects'
import { ANTI_MAGIC_SHELL_ENCHANTMENT_ID } from '../enchantments/antiMagicShell'
import { BUBBLE_ENCHANTMENT_ID } from '../enchantments/bubble'
import { grantEnchantmentStacks } from '../enchantments/grantEnchantmentStacks'

function ownedBurdenCount(state: GameState): number {
  const deck = state.player.deck
  const inPiles = [...deck.drawPile, ...deck.hand, ...deck.discardPile].reduce((acc, cid) => {
    const inst = deck.cardById[cid]
    return acc + (isBurdenCardId(inst?.templateId) ? 1 : 0)
  }, 0)
  // Burdens queued by enemy boons (and similar) should count for "most generous" interpretation.
  const queued = state.combat?.burdenAddQueue.reduce((acc, e) => acc + (isBurdenCardId(e.cardId) ? 1 : 0), 0) ?? 0
  return inPiles + queued
}

export type RelicEffectContext = Readonly<{
  addedCardInstanceId?: CardInstanceId
}>

export function applyRelicEffect(state: GameState, fx: Effect, ctx?: RelicEffectContext): GameState {
  if (fx.kind === 'HEAL') {
    const nextHp = Math.min(state.player.maxHp, state.player.hp + fx.amount)
    return { ...state, player: { ...state.player, hp: nextHp } }
  }
  if (fx.kind === 'MODIFY_GAME_LEVEL') {
    const min = fx.min ?? 0
    const next = Math.max(min, state.level + fx.amount)
    if (next === state.level) return state
    return {
      ...state,
      level: next,
      runStats: { ...state.runStats, maxLevelReached: Math.max(state.runStats.maxLevelReached, next) },
    }
  }
  if (fx.kind === 'GAIN_SHIELD') {
    const target = fx.target ?? 'player'
    if (target !== 'player') return state
    const amount = resolveShieldGainAmount(
      fx.amount,
      0,
      shieldPowerPenaltyFromEnchantments(state, { kind: 'PLAYER' }),
      false,
    )
    if (amount <= 0) return state
    return { ...state, player: { ...state.player, shield: state.player.shield + amount } }
  }
  if (fx.kind === 'GAIN_SHIELD_EQUAL_TO_LEVEL') {
    const amount = resolveShieldGainAmount(
      state.level,
      0,
      shieldPowerPenaltyFromEnchantments(state, { kind: 'PLAYER' }),
      false,
    )
    if (amount <= 0) return state
    return { ...state, player: { ...state.player, shield: state.player.shield + amount } }
  }
  if (fx.kind === 'GAIN_LOCKED_SHIELD') {
    const amount = resolveShieldGainAmount(
      fx.amount,
      0,
      shieldPowerPenaltyFromEnchantments(state, { kind: 'PLAYER' }),
      false,
    )
    if (amount <= 0) return state
    return { ...state, player: { ...state.player, lockedShield: state.player.lockedShield + amount } }
  }
  if (fx.kind === 'GAIN_MAX_HP') {
    const nextMax = state.player.maxHp + fx.amount
    // Gaining max HP also heals that much missing HP (up to the new max).
    const nextHp = Math.min(nextMax, state.player.hp + fx.amount)
    return { ...state, player: { ...state.player, maxHp: nextMax, hp: nextHp } }
  }
  if (fx.kind === 'GAIN_GOLD') {
    const gained = Math.max(0, fx.amount)
    return {
      ...state,
      player: { ...state.player, gold: state.player.gold + fx.amount },
      runStats: { ...state.runStats, totalGoldObtained: state.runStats.totalGoldObtained + gained },
    }
  }
  if (fx.kind === 'GAIN_INTEREST') {
    const interest = Math.ceil((state.player.gold * fx.percentAmount) / 100)
    return {
      ...state,
      player: { ...state.player, gold: state.player.gold + interest },
      runStats: { ...state.runStats, totalGoldObtained: state.runStats.totalGoldObtained + Math.max(0, interest) },
    }
  }
  if (fx.kind === 'GAIN_KEYS') {
    return { ...state, player: { ...state.player, keys: state.player.keys + fx.amount } }
  }
  if (fx.kind === 'GAIN_POWER') {
    if (fx.duration === 'combat') return addCombatPower(state, fx.amount)
    return { ...state, player: { ...state.player, power: state.player.power + fx.amount } }
  }
  if (fx.kind === 'GAIN_SHIELD_POWER') {
    if (fx.duration === 'combat') return addCombatShieldPower(state, fx.amount)
    return { ...state, player: { ...state.player, shieldPower: state.player.shieldPower + fx.amount } }
  }
  if (fx.kind === 'GAIN_FIREPOWER') {
    if (fx.duration === 'combat') return addCombatFirepower(state, fx.amount)
    return { ...state, player: { ...state.player, firepower: state.player.firepower + fx.amount } }
  }
  if (fx.kind === 'GAIN_ALL_POWERS_PER_OWNED_BURDEN') {
    const n = ownedBurdenCount(state)
    let s = addCombatPower(state, n)
    s = addCombatShieldPower(s, n)
    s = addCombatFirepower(s, n)
    return s
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
  if (fx.kind === 'GAIN_HAND_SIZE') {
    const next = state.player.baseHandSize + fx.amount
    return { ...state, player: { ...state.player, baseHandSize: next, handSize: next } }
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
      player: { ...state.player, bunnies: multiplyBunnies(state.player.bunnies, fx.amount) },
    }
  }
  if (fx.kind === 'UPGRADE_SPECIFIC_CARD') {
    return upgradeSpecificCards(state, fx.target, fx.numberOfTargets, fx.upgradeAmount)
  }
  if (fx.kind === 'UPGRADE_RANDOM_DECK_CARDS') {
    return upgradeRandomDeckCards(state, fx.numberOfTargets, fx.upgradeAmount)
  }
  if (fx.kind === 'UPGRADE_ADDED_CARD') {
    const id = ctx?.addedCardInstanceId
    if (!id) return state
    return upgradeCardInstance(state, id, fx.upgradeAmount)
  }
  if (fx.kind === 'ACTIVATE_FREE_FIRST_FIRE_SPELL') {
    if (!state.combat) return state
    return { ...state, combat: { ...state.combat, freeFirstFireSpell: true } }
  }
  if (fx.kind === 'NEXT_SPELL_COSTS_0') {
    if (!state.combat) return state
    return { ...state, combat: { ...state.combat, nextSpellCosts0: true } }
  }
  if (fx.kind === 'ADD_RANDOM_POTION_TO_HAND') {
    return addRandomPotionToHand(state)
  }
  if (fx.kind === 'APPLY_ENCHANTMENT') {
    const combat0 = state.combat
    if (!combat0) return state
    const tmpl = Enchantments[fx.enchantmentId]
    if (!tmpl) return state

    const target: EnchantmentTargetRef | null =
      fx.target === 'global'
        ? { kind: 'GLOBAL' }
        : fx.target === 'self'
          ? { kind: 'PLAYER' }
          : null
    if (!target) return state

    const usesAmountAsStacks =
      fx.enchantmentId === BUBBLE_ENCHANTMENT_ID || fx.enchantmentId === ANTI_MAGIC_SHELL_ENCHANTMENT_ID
    const stacksToAdd = usesAmountAsStacks ? Math.max(1, fx.amount ?? 1) : 1

    return grantEnchantmentStacks(state, {
      templateId: fx.enchantmentId,
      owner: { kind: 'PLAYER' },
      target,
      stacks: stacksToAdd,
      amountOverride: usesAmountAsStacks ? undefined : fx.amount,
    })
  }

  return state
}

