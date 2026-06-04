import type { RngState } from '../../core/rng/rng'
import { rngNext } from '../../core/rng/rng'
import type { GameState } from '../../core/types/state'
import type { Effect } from '../../data/effects'
import type { GameEvent } from '../../reducers/events'

export type CriticalFxVariant = 'attack' | 'bunnies' | 'shield'

type CriticalEffect = Extract<Effect, { kind: 'CRITICAL' }>

/** Combine multiple CRITICAL rows: sum chances/multipliers; keep max upgrade tiers. */
export function mergeCriticalEffectsInList(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  const criticals: CriticalEffect[] = []
  for (const fx of effects) {
    if (fx.kind === 'CRITICAL') criticals.push(fx)
  }
  if (criticals.length <= 1) return effects

  const merged: CriticalEffect = {
    kind: 'CRITICAL',
    chancePercent: criticals.reduce((sum, fx) => sum + fx.chancePercent, 0),
    multiplierPercent: criticals.reduce((sum, fx) => sum + fx.multiplierPercent, 0),
    chanceUpgradeValue: Math.max(...criticals.map((fx) => fx.chanceUpgradeValue)),
    multiplierUpgradeValue: Math.max(...criticals.map((fx) => fx.multiplierUpgradeValue)),
  }

  const out: Effect[] = []
  let inserted = false
  for (const fx of effects) {
    if (fx.kind === 'CRITICAL') {
      if (!inserted) {
        out.push(merged)
        inserted = true
      }
    } else {
      out.push(fx)
    }
  }
  return out
}

export function aggregateCriticalEffects(
  effects: ReadonlyArray<Effect>,
): Readonly<{ chancePercent: number; multiplierPercent: number }> | null {
  let chancePercent = 0
  let multiplierPercent = 0
  for (const fx of effects) {
    if (fx.kind !== 'CRITICAL') continue
    chancePercent += fx.chancePercent
    multiplierPercent += fx.multiplierPercent
  }
  if (chancePercent <= 0 && multiplierPercent <= 0) return null
  return { chancePercent, multiplierPercent }
}

/** Card critical chance + (player Luck × 5). */
export function effectiveCriticalChancePercent(cardChancePercent: number, luck: number): number {
  return cardChancePercent + Math.max(0, luck | 0) * 5
}

export function rollCriticalHit(
  rng: RngState,
  chancePercent: number,
): Readonly<{ rng: RngState; hit: boolean }> {
  if (chancePercent >= 100) return { rng, hit: true }
  const [nextRng, roll] = rngNext(rng)
  return { rng: nextRng, hit: roll * 100 < chancePercent }
}

function ceilScaled(n: number, factor: number): number {
  return Math.ceil(n * factor)
}

function multiplyEffectNumbers(fx: Effect, factor: number): Effect {
  if (fx.kind === 'CRITICAL') return fx

  switch (fx.kind) {
    case 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL':
      return { ...fx, multiplier: ceilScaled(fx.multiplier, factor) }
    case 'UPGRADE_SELECTED_CARD':
    case 'UPGRADE_SPECIFIC_CARD':
    case 'UPGRADE_RANDOM_DECK_CARDS':
      return {
        ...fx,
        numberOfTargets: ceilScaled(fx.numberOfTargets, factor),
        upgradeAmount: ceilScaled(fx.upgradeAmount, factor),
      }
    case 'CONSUME_SELECTED_CARD':
      return { ...fx, numberOfTargets: ceilScaled(fx.numberOfTargets, factor) }
    case 'UPGRADE_ADDED_CARD':
      return { ...fx, upgradeAmount: ceilScaled(fx.upgradeAmount, factor) }
    case 'GAIN_INTEREST':
      return { ...fx, percentAmount: ceilScaled(fx.percentAmount, factor) }
    case 'APPLY_ENCHANTMENT':
      return fx.amount !== undefined ? { ...fx, amount: ceilScaled(fx.amount, factor) } : fx
    default:
      if ('amount' in fx && typeof fx.amount === 'number') {
        return { ...fx, amount: ceilScaled(fx.amount, factor) }
      }
      return fx
  }
}

/** Multiply all numeric card effect values by `multiplierPercent / 100`. */
export function applyCriticalMultiplierToEffects(
  effects: ReadonlyArray<Effect>,
  multiplierPercent: number,
): ReadonlyArray<Effect> {
  if (multiplierPercent <= 100) return effects
  const factor = multiplierPercent / 100
  return effects.map((fx) => multiplyEffectNumbers(fx, factor))
}

export function criticalFxVariant(
  tags: ReadonlyArray<string>,
  effects: ReadonlyArray<Effect>,
): CriticalFxVariant {
  if (
    tags.includes('addBunnies') ||
    tags.includes('multBunnies') ||
    effects.some(
      (e) =>
        e.kind === 'ADD_BUNNIES' ||
        e.kind === 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL' ||
        e.kind === 'MULTIPLY_BUNNIES',
    )
  ) {
    return 'bunnies'
  }
  if (
    tags.includes('addShield') ||
    tags.includes('lockShield') ||
    effects.some(
      (e) =>
        e.kind === 'GAIN_SHIELD' ||
        e.kind === 'GAIN_LOCKED_SHIELD' ||
        e.kind === 'LOCK_ALL_SHIELD' ||
        e.kind === 'GAIN_SHIELD_EQUAL_TO_LEVEL',
    )
  ) {
    return 'shield'
  }
  return 'attack'
}

export function cardEffectsWithoutCritical(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  return effects.filter((fx) => fx.kind !== 'CRITICAL')
}

export type CriticalRollResult = Readonly<{
  state: GameState
  effects: ReadonlyArray<Effect>
  events: ReadonlyArray<GameEvent>
}>

/** Roll critical for a card play; strips CRITICAL effects and may scale other values. */
export function applyCriticalRollToCardEffects(
  state: GameState,
  effects: ReadonlyArray<Effect>,
  cardTags: ReadonlyArray<string>,
): CriticalRollResult {
  const agg = aggregateCriticalEffects(effects)
  const resolved = cardEffectsWithoutCritical(effects)
  if (!agg) return { state, effects: resolved, events: [] }

  const chance = effectiveCriticalChancePercent(agg.chancePercent, state.player.luck)
  const roll = rollCriticalHit(state.rng, chance)
  let s: GameState = { ...state, rng: roll.rng }
  if (!roll.hit) return { state: s, effects: resolved, events: [] }

  const multiplied = applyCriticalMultiplierToEffects(resolved, agg.multiplierPercent)
  return {
    state: s,
    effects: multiplied,
    events: [
      {
        type: 'EVT/CRITICAL_HIT',
        variant: criticalFxVariant(cardTags, multiplied),
        multiplierPercent: agg.multiplierPercent,
      },
    ],
  }
}
