import type { Effect } from '../../data/effects'

export type AddBunniesEqualToGameLevelEffect = Extract<Effect, { kind: 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL' }>

/** Bunnies from the effect before bunny power: `gameLevel * multiplier`. */
export function bunnySummonsEffectBunnies(fx: AddBunniesEqualToGameLevelEffect, gameLevel: number): number {
  return Math.max(0, gameLevel) * fx.multiplier
}

/** Total bunnies including bunny power (applied after the effect total). */
export function bunnySummonsTotalBunnies(
  fx: AddBunniesEqualToGameLevelEffect,
  gameLevel: number,
  bunnyPower: number,
): number {
  return bunnySummonsEffectBunnies(fx, gameLevel) + bunnyPower
}
