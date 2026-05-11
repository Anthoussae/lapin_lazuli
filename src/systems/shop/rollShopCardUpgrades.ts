import type { RngState } from '../../core/rng/rng'
import { rngNext } from '../../core/rng/rng'

/**
 * Upgrade points `p = (level + luck) * 5` (percent-style; may exceed 100).
 * Each full 100 guarantees one upgrade; leftover grants a fractional chance for one more.
 * Examples: 25 → 25% for +1; 120 → +1 plus 20% for +2; 250 → +2 plus 50% for +3.
 */
export function rollShopCardUpgrades(rng: RngState, level: number, luck: number): { rng: RngState; upgrades: number } {
  const p = Math.max(0, (level + luck) * 5)
  let remaining = p
  let upgrades = 0
  let r = rng

  while (remaining >= 100) {
    upgrades += 1
    remaining -= 100
  }

  if (remaining > 0) {
    const [r2, u] = rngNext(r)
    r = r2
    if (u < remaining / 100) {
      upgrades += 1
    }
  }

  return { rng: r, upgrades }
}
