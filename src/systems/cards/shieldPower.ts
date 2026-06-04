/** Cards tagged addShield gain bonus temporary shield from {@link PlayerState.shieldPower}. */
export function cardHasAddShieldTag(tags: ReadonlyArray<string>): boolean {
  return tags.includes('addShield')
}

export function boostShieldGain(baseAmount: number, shieldPower: number): number {
  return shieldPower > 0 ? baseAmount + shieldPower : baseAmount
}

/** Apply shield-power boost (when applicable) then subtract Rust-style penalties; floors at 0. */
export function resolveShieldGainAmount(
  baseAmount: number,
  shieldPowerBonus: number,
  shieldPowerPenalty: number,
  appliesShieldPowerBoost: boolean,
): number {
  const boosted =
    appliesShieldPowerBoost && shieldPowerBonus > 0
      ? boostShieldGain(baseAmount, shieldPowerBonus)
      : baseAmount
  return Math.max(0, boosted - shieldPowerPenalty)
}
