import type { Effect } from '../../data/effects'

/** +50% rounded up (foil modifier). */
export function foilCeil50(n: number): number {
  return Math.ceil(n * 1.5)
}

function foilEffectUpgradeValues(fx: Effect): Effect {
  if (fx.upgradeValue === undefined || fx.upgradeValue <= 0) return fx
  return { ...fx, upgradeValue: foilCeil50(fx.upgradeValue) }
}

function foilEffectAmounts(fx: Effect): Effect {
  if (!('amount' in fx)) return fx
  return { ...fx, amount: foilCeil50(fx.amount) }
}

/** Foils `upgradeValue` on each effect (before upgrade scaling). */
export function foilCardEffectUpgradeValues(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  return effects.map(foilEffectUpgradeValues)
}

/** Foils `amount` on each effect (after upgrade scaling). */
export function foilCardEffectAmounts(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  return effects.map(foilEffectAmounts)
}
