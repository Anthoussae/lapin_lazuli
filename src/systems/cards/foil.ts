import type { Effect } from '../../data/effects'

/** +50% rounded up (foil modifier). */
export function foilCeil50(n: number): number {
  return Math.ceil(n * 1.5)
}

function foilEffectBaseValues(fx: Effect): Effect {
  if (fx.kind === 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL') {
    return { ...fx, multiplier: foilCeil50(fx.multiplier) }
  }
  if (fx.kind === 'CRITICAL') {
    return {
      ...fx,
      chancePercent: foilCeil50(fx.chancePercent),
      multiplierPercent: foilCeil50(fx.multiplierPercent),
    }
  }
  if (!('amount' in fx)) return fx
  if (typeof fx.amount !== 'number') return fx
  return { ...fx, amount: foilCeil50(fx.amount) }
}

/** Foils base numeric fields on each effect (before upgrade scaling; `upgradeValue` is unchanged). */
export function foilCardEffectBaseValues(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  return effects.map(foilEffectBaseValues)
}
