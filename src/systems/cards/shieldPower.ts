/** Cards tagged addShield gain bonus temporary shield from {@link PlayerState.shieldPower}. */
export function cardHasAddShieldTag(tags: ReadonlyArray<string>): boolean {
  return tags.includes('addShield')
}

export function boostShieldGain(baseAmount: number, shieldPower: number): number {
  return shieldPower > 0 ? baseAmount + shieldPower : baseAmount
}
