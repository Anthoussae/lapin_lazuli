import type { CardId, EnchantmentId } from '../../core/types/ids'
import type { DiceSpec } from '../../core/rng/dice'
import type { EnemyIntent, EnemyIntentExtraEffect } from '../../core/types/state'
import type { EnemyIntentKind } from '../../data/enemyIntentKinds'

/** Discriminant of {@link EnemyIntentExtraEffect}; keep metadata tables below in sync when adding kinds. */
export type EnemyIntentExtraEffectKind = EnemyIntentExtraEffect['effect']

/**
 * Extra effects that count as self-buffs on the enemy for tagging (display / hybrid move kinds).
 */
const INTENT_EXTRA_EFFECT_ENEMY_BUFF: ReadonlySet<EnemyIntentExtraEffectKind> = new Set([
  'strengthgain',
  'enemyLockedShieldGain',
  'enemyShieldGain',
  'vampiric',
])

/**
 * Extra effects that apply negative pressure on the player for tagging.
 */
const INTENT_EXTRA_EFFECT_PLAYER_DEBUFF: ReadonlySet<EnemyIntentExtraEffectKind> = new Set([
  'playerTurnStartBunnyDrain',
  'shuffleBurdenIntoDeck',
  'applyEnchantment',
])

export function isEnemyBuffEffect(effect: EnemyIntentExtraEffect): boolean {
  return INTENT_EXTRA_EFFECT_ENEMY_BUFF.has(effect.effect)
}

export function isPlayerDebuffEffect(effect: EnemyIntentExtraEffect): boolean {
  return INTENT_EXTRA_EFFECT_PLAYER_DEBUFF.has(effect.effect)
}

/** True when this row must be rolled into a numeric amount (preserves one dice roll per row, in array order). */
export function isEnemyLockedShieldGainDiceRoll(
  fx: EnemyIntentExtraEffect,
): fx is Readonly<{ effect: 'enemyLockedShieldGain'; roll: DiceSpec }> {
  return fx.effect === 'enemyLockedShieldGain' && 'roll' in fx
}

/** Classification tag copied from enemy data when the intent is rolled. */
export function enemyIntentKind(intent: EnemyIntent): EnemyIntentKind {
  return intent.intentKind
}

/**
 * Extra damage from enemy strength on an attack intent: +1 flat damage per strength point.
 * This is intentionally NOT scaled by enemy level or intent instances.
 */
export function enemyAttackStrengthDamageBonus(strength: number): number {
  return Math.max(0, strength | 0)
}

/** Sum of all `strengthgain` amounts on an intent (other effect kinds ignored until implemented). */
export function strengthDeltaFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): number {
  if (!effects?.length) return 0
  let d = 0
  for (const e of effects) {
    if (e.effect !== 'strengthgain') continue
    d += e.amount
  }
  return d
}

/** Sum of `playerTurnStartBunnyDrain` amounts applied when an attack resolves. */
export function playerTurnStartBunnyDrainFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): number {
  if (!effects?.length) return 0
  let d = 0
  for (const e of effects) {
    if (e.effect !== 'playerTurnStartBunnyDrain') continue
    d += e.amount
  }
  return d
}

/** Locked shield granted to the acting enemy when an attack resolves (pre-rolled amounts only). */
export function enemyLockedShieldGainFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): number {
  if (!effects?.length) return 0
  let d = 0
  for (const e of effects) {
    if (e.effect !== 'enemyLockedShieldGain') continue
    if ('amount' in e) d += e.amount
  }
  return d
}

/** Regular shield granted to the acting enemy when an attack resolves. */
export function enemyShieldGainFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): number {
  if (!effects?.length) return 0
  let d = 0
  for (const e of effects) {
    if (e.effect !== 'enemyShieldGain') continue
    d += e.amount
  }
  return d
}

export function intentHasVampiric(effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined): boolean {
  return !!effects?.some((e) => e.effect === 'vampiric')
}

export function burdenShuffleEntriesFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): ReadonlyArray<{ cardId: CardId; count: number }> {
  if (!effects?.length) return []
  const totals = new Map<CardId, number>()
  for (const e of effects) {
    if (e.effect !== 'shuffleBurdenIntoDeck') continue
    totals.set(e.cardId, (totals.get(e.cardId) ?? 0) + e.count)
  }
  return [...totals.entries()].map(([cardId, count]) => ({ cardId, count }))
}

export function applyEnchantmentGrantsFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): ReadonlyArray<{ enchantmentId: EnchantmentId; stacks: number; amountOverride?: number }> {
  if (!effects?.length) return []
  const grants: Array<{ enchantmentId: EnchantmentId; stacks: number; amountOverride?: number }> = []
  for (const e of effects) {
    if (e.effect !== 'applyEnchantment') continue
    grants.push({
      enchantmentId: e.enchantmentId,
      stacks: e.stacks ?? 1,
      amountOverride: e.setEnchantmentEffectsAmounts,
    })
  }
  return grants
}
