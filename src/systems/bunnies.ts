/** Player bunny count: no fractions (`Math.ceil`). Negatives allowed (e.g. Draining). */
export function normalizeBunnies(n: number): number {
  return Math.ceil(n)
}

/** Apply a bunny multiplier; multiplier is exact, resulting count is rounded up. */
export function multiplyBunnies(current: number, multiplier: number): number {
  return normalizeBunnies(current * multiplier)
}

/** Keep in sync with `--bunny-release-sprite-max` in tokens.css. */
export const BUNNY_RELEASE_SPRITE_MAX = 50

/** Puff sprites for one release: |bunnies released|, capped at {@link BUNNY_RELEASE_SPRITE_MAX}. */
export function bunnyReleaseSpriteCount(bunniesReleased: number): number {
  const n = Math.abs(Math.trunc(bunniesReleased))
  return Math.min(n, BUNNY_RELEASE_SPRITE_MAX)
}
