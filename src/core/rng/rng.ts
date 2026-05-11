export type RngState = Readonly<{
  s: number
}>

export function rngFromSeed(seed: number): RngState {
  // Force to uint32.
  return { s: seed >>> 0 }
}

export function rngNext(rng: RngState): readonly [RngState, number] {
  // Mulberry32, but carried as explicit state for determinism.
  // https://stackoverflow.com/a/47593316
  let t = (rng.s + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const out = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return [{ s: (rng.s + 1) >>> 0 }, out]
}

export function rngInt(rng: RngState, minInclusive: number, maxExclusive: number): readonly [RngState, number] {
  const [r2, u] = rngNext(rng)
  const span = Math.max(1, maxExclusive - minInclusive)
  return [r2, (minInclusive + Math.floor(u * span)) | 0]
}
