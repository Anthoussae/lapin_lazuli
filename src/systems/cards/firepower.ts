export function cardHasFireDamageTags(tags: ReadonlyArray<string>): boolean {
  return tags.includes('fire') && tags.includes('damage')
}

/** Stored firepower of 0 means no bonus; otherwise damage is multiplied by the stored value. */
export function boostFireDealDamage(baseAmount: number, firepowerMultiplier: number): number {
  return firepowerMultiplier > 0 ? baseAmount * firepowerMultiplier : baseAmount
}
