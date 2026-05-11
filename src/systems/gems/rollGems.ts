import type { RngState } from '../../core/rng/rng'
import { rngInt } from '../../core/rng/rng'
import type { GemId } from '../../core/types/ids'
import { Gems } from '../../data/gems'

export const GemPool: ReadonlyArray<GemId> = (Object.keys(Gems) as GemId[]).sort()

export function rollGemOffers(rng: RngState, count = 3): { rng: RngState; offered: ReadonlyArray<GemId> } {
  const pool = [...GemPool]
  const offered: GemId[] = []
  let nextRng = rng
  for (let i = 0; i < count && pool.length > 0; i++) {
    const [r2, idx] = rngInt(nextRng, 0, pool.length)
    nextRng = r2
    offered.push(pool.splice(idx, 1)[0]!)
  }
  return { rng: nextRng, offered }
}
