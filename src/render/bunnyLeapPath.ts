/** Deterministic unit float in [0, 1) from seed + salt. */
export function hash01(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt, 0x9e3779b9)) | 0
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function pickArcCount(seed: number, arcMin: number, arcMax: number): number {
  const span = arcMax - arcMin + 1
  return arcMin + Math.floor(hash01(seed, 17) * span)
}

/** Peak height of one bounce arc, chosen uniformly between min and max (px). */
export function pickApexPx(seed: number, minPx: number, maxPx: number): number {
  if (maxPx <= minPx) return minPx
  return minPx + hash01(seed, 23) * (maxPx - minPx)
}

export function pickRangedMs(seed: number, minMs: number, maxMs: number, salt: number): number {
  if (maxMs <= minMs) return minMs
  return Math.round(minMs + hash01(seed, salt) * (maxMs - minMs))
}

export function pickRangedPx(seed: number, minPx: number, maxPx: number, salt: number): number {
  if (maxPx <= minPx) return minPx
  return minPx + hash01(seed, salt) * (maxPx - minPx)
}

/** Straight-line drift away from the leap endpoint (random direction and distance). */
export function pickLandPuffDrift(
  seed: number,
  distanceMinPx: number,
  distanceMaxPx: number,
): Readonly<{ dx: number; dy: number }> {
  const dist = pickRangedPx(seed, distanceMinPx, distanceMaxPx, 42)
  const angle = hash01(seed, 41) * Math.PI * 2
  return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist }
}

/** Position along a multi-arc bouncing path (screen Y grows downward; apex subtracts). */
export function bouncePathPoint(
  t: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  arcCount: number,
  apexPx: number,
): Readonly<{ x: number; y: number }> {
  const clamped = Math.min(1, Math.max(0, t))
  const x = fromX + (toX - fromX) * clamped
  const yLinear = fromY + (toY - fromY) * clamped
  if (clamped >= 1) return { x: toX, y: toY }

  const frac = clamped * arcCount
  const localT = frac - Math.floor(frac)
  const bounce = Math.sin(Math.PI * localT) * apexPx
  return { x, y: yLinear - bounce }
}
