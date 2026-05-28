export function cardHasFireDamageTags(tags: ReadonlyArray<string>): boolean {
  return tags.includes('fire') && tags.includes('damage')
}

/** Flat firepower adds to base; multiplier applies after (0 means no multiplier). */
export function boostFireDealDamage(
  baseAmount: number,
  firepower: number,
  firepowerMultiplier: number,
): number {
  let amount = baseAmount
  if (firepower > 0) amount += firepower
  if (firepowerMultiplier > 0) amount *= firepowerMultiplier
  return amount
}
