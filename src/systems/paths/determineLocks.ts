import type { PathId } from '../../core/types/ids'
import type { RngState } from '../../core/rng/rng'
import { rngNext } from '../../core/rng/rng'
import { Paths } from '../../data/paths'

type SlotItem = Readonly<{ slotIdx: number; id: PathId; f: number }>

/**
 * Per-offered-slot lock rolls from relative path frequencies among this offering.
 * Highest-frequency path(s) never lock; tie for highest → no locks.
 * See game rules for low / middle tier chances.
 */
export function determineLocks(
  rng: RngState,
  offered: ReadonlyArray<PathId>,
  level: number,
): { rng: RngState; slotLocked: boolean[] } {
  const n = offered.length
  const slotLocked = Array.from({ length: n }, () => false)
  if (n === 0) return { rng, slotLocked }

  const items: SlotItem[] = offered.map((id, slotIdx) => ({
    slotIdx,
    id,
    f: Paths[id]?.frequency ?? 0,
  }))

  const freqs = items.map((i) => i.f)
  const maxF = Math.max(...freqs)
  const minF = Math.min(...freqs)
  const countMax = items.filter((i) => i.f === maxF).length

  let r = rng

  if (countMax >= 2 || maxF === minF) {
    return { rng: r, slotLocked }
  }

  const pLow = Math.min(0.95, (10 + level * 2) / 100)
  const pMid = Math.min(1, (5 + level) / 100)

  const countMin = items.filter((i) => i.f === minF).length

  if (countMin >= 2) {
    for (const it of items.filter((i) => i.f === minF)) {
      const [r2, u] = rngNext(r)
      r = r2
      if (u < pLow) slotLocked[it.slotIdx] = true
    }
    return { rng: r, slotLocked }
  }

  if (n === 3 && countMin === 1 && countMax === 1) {
    const sorted = [...items].sort((a, b) => a.f - b.f)
    const low = sorted[0]!
    const mid = sorted[1]!
    const high = sorted[2]!
    if (low.f < mid.f && mid.f < high.f) {
      let [r2, u] = rngNext(r)
      r = r2
      if (u < pMid) slotLocked[mid.slotIdx] = true
      ;[r2, u] = rngNext(r)
      r = r2
      if (u < pLow) slotLocked[low.slotIdx] = true
      return { rng: r, slotLocked }
    }
  }

  const mins = items.filter((i) => i.f === minF)
  if (mins.length === 1) {
    const it = mins[0]!
    const [r2, u] = rngNext(r)
    r = r2
    if (u < pLow) slotLocked[it.slotIdx] = true
  }

  return { rng: r, slotLocked }
}
