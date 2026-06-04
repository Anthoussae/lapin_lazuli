import type { Effect } from '../../data/effects'

/** +50% rounded up (foil modifier). */
export function foilCeil50(n: number): number {
  return Math.ceil(n * 1.5)
}

function foilEffectUpgradeValues(fx: Effect): Effect {
  if (fx.kind === 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL') {
    if (fx.multiplierUpgradePerLevel <= 0) return fx
    return { ...fx, multiplierUpgradePerLevel: foilCeil50(fx.multiplierUpgradePerLevel) }
  }
  if (fx.kind === 'CRITICAL') {
    return {
      ...fx,
      chanceUpgradeValue: fx.chanceUpgradeValue > 0 ? foilCeil50(fx.chanceUpgradeValue) : fx.chanceUpgradeValue,
      multiplierUpgradeValue:
        fx.multiplierUpgradeValue > 0 ? foilCeil50(fx.multiplierUpgradeValue) : fx.multiplierUpgradeValue,
    }
  }
  if (fx.upgradeValue === undefined || fx.upgradeValue <= 0) return fx
  return { ...fx, upgradeValue: foilCeil50(fx.upgradeValue) }
}

function foilEffectAmounts(fx: Effect): Effect {
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

/** Foils `upgradeValue` on each effect (before upgrade scaling). */
export function foilCardEffectUpgradeValues(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  return effects.map(foilEffectUpgradeValues)
}

/** Foils `amount` on each effect (after upgrade scaling). */
export function foilCardEffectAmounts(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  return effects.map(foilEffectAmounts)
}
