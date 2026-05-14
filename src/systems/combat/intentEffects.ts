import type { CardId } from '../../core/types/ids'
import type { DiceSpec } from '../../core/rng/dice'
import type { EnemyIntent, EnemyIntentExtraEffect } from '../../core/types/state'

export type EnemyMoveKind = 'attack' | 'buff' | 'debuff'

/** Discriminant of {@link EnemyIntentExtraEffect}; keep metadata tables below in sync when adding kinds. */
export type EnemyIntentExtraEffectKind = EnemyIntentExtraEffect['effect']

/**
 * Extra effects that count as self-buffs on the enemy for tagging (display / hybrid move kinds).
 * Must match {@link INTENT_EXTRA_EFFECT_MOVE_KIND} entries that map to `'buff'`.
 */
const INTENT_EXTRA_EFFECT_ENEMY_BUFF: ReadonlySet<EnemyIntentExtraEffectKind> = new Set([
  'strengthgain',
  'enemyLockedShieldGain',
  'vampiric',
])

/**
 * Extra effects that apply negative pressure on the player for tagging.
 * Must match {@link INTENT_EXTRA_EFFECT_MOVE_KIND} entries that map to `'debuff'`.
 */
const INTENT_EXTRA_EFFECT_PLAYER_DEBUFF: ReadonlySet<EnemyIntentExtraEffectKind> = new Set([
  'playerTurnStartBunnyDrain',
  'shuffleBurdenIntoDeck',
])

/** Maps each intent extra kind to a move tag from its extra line (null = no extra tag). */
const INTENT_EXTRA_EFFECT_MOVE_KIND: Readonly<Record<EnemyIntentExtraEffectKind, EnemyMoveKind | null>> = {
  strengthgain: 'buff',
  enemyLockedShieldGain: 'buff',
  vampiric: 'buff',
  playerTurnStartBunnyDrain: 'debuff',
  shuffleBurdenIntoDeck: 'debuff',
}

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

/** Move tags for display and future rules; hybrid attacks can include multiple kinds. */
export function enemyIntentMoveKinds(intent: EnemyIntent): ReadonlyArray<EnemyMoveKind> {
  if (intent.kind === 'WAIT') return []
  const kinds = new Set<EnemyMoveKind>()
  if (intent.kind === 'ATTACK') kinds.add('attack')
  if (intent.kind === 'BUFF') kinds.add('buff')
  if (intent.kind === 'DEBUFF') kinds.add('debuff')
  for (const fx of intent.effects ?? []) {
    const mk = INTENT_EXTRA_EFFECT_MOVE_KIND[fx.effect]
    if (mk) kinds.add(mk)
  }
  const ordered: EnemyMoveKind[] = ['attack', 'buff', 'debuff']
  return ordered.filter((k) => kinds.has(k))
}

/** Sum of all `strengthgain` values on an intent (other effect kinds ignored until implemented). */
export function strengthDeltaFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): number {
  if (!effects?.length) return 0
  let d = 0
  for (const e of effects) {
    if (e.effect !== 'strengthgain') continue
    d += e.value
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
