/** Damage hits shield first; overflow reduces HP. */
export function applyDamageThroughShield(
  shield: number,
  hp: number,
  damage: number,
): { shield: number; hp: number } {
  if (damage <= 0) return { shield, hp }
  const absorbed = Math.min(Math.max(0, shield), damage)
  const through = damage - absorbed
  return {
    shield: Math.max(0, shield - absorbed),
    hp: Math.max(0, hp - through),
  }
}

/** Player damage absorbs temporary shield, then locked shield, then HP. */
export function applyPlayerDamageThroughShields(
  shield: number,
  lockedShield: number,
  hp: number,
  damage: number,
): { shield: number; lockedShield: number; hp: number; unshieldedDamage: number } {
  if (damage <= 0) return { shield, lockedShield, hp, unshieldedDamage: 0 }
  let remaining = damage
  const absorbedRegular = Math.min(Math.max(0, shield), remaining)
  remaining -= absorbedRegular
  const absorbedLocked = Math.min(Math.max(0, lockedShield), remaining)
  remaining -= absorbedLocked
  const unshieldedDamage = Math.min(Math.max(0, hp), remaining)
  return {
    shield: Math.max(0, shield - absorbedRegular),
    lockedShield: Math.max(0, lockedShield - absorbedLocked),
    hp: Math.max(0, hp - unshieldedDamage),
    unshieldedDamage,
  }
}
