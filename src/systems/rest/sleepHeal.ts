/** Fraction of max HP that Sleep may restore (before capping at missing HP). */
export const REST_SLEEP_HEAL_FRACTION = 0.4

export function computeSleepHealAmount(maxHp: number, hp: number): number {
  const cap = Math.floor(maxHp * REST_SLEEP_HEAL_FRACTION)
  return Math.min(cap, Math.max(0, maxHp - hp))
}

export function describeSleepHealTooltip(healAmount: number): string {
  return `Recover ${healAmount} health.`
}
