import type { CardId } from '../../core/types/ids'
import type { EnemyIntent, EnemyIntentExtraEffect } from '../../core/types/state'

export type EnemyMoveKind = 'attack' | 'buff' | 'debuff'

export function isEnemyBuffEffect(effect: EnemyIntentExtraEffect): boolean {
  return effect.effect === 'strengthgain' || effect.effect === 'enemyLockedShieldGain' || effect.effect === 'vampiric'
}

export function isPlayerDebuffEffect(effect: EnemyIntentExtraEffect): boolean {
  return effect.effect === 'playerTurnStartBunnyDrain' || effect.effect === 'shuffleBurdenIntoDeck'
}

/** Move tags for display and future rules; hybrid attacks can include multiple kinds. */
export function enemyIntentMoveKinds(intent: EnemyIntent): ReadonlyArray<EnemyMoveKind> {
  if (intent.kind === 'WAIT') return []
  const kinds = new Set<EnemyMoveKind>()
  if (intent.kind === 'ATTACK') kinds.add('attack')
  if (intent.kind === 'BUFF') kinds.add('buff')
  if (intent.kind === 'DEBUFF') kinds.add('debuff')
  for (const fx of intent.effects ?? []) {
    if (isEnemyBuffEffect(fx)) kinds.add('buff')
    if (isPlayerDebuffEffect(fx)) kinds.add('debuff')
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
    if (e.effect === 'strengthgain') d += e.value
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
    if (e.effect === 'playerTurnStartBunnyDrain') d += e.amount
  }
  return d
}

/** Locked shield granted to the acting enemy when an attack resolves. */
export function enemyLockedShieldGainFromIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
): number {
  if (!effects?.length) return 0
  let d = 0
  for (const e of effects) {
    if (e.effect === 'enemyLockedShieldGain' && 'amount' in e) d += e.amount
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
