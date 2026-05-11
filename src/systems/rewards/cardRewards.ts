import type { CardId } from '../../core/types/ids'
import type { RngState } from '../../core/rng/rng'
import { rngInt, rngNext } from '../../core/rng/rng'
import { Cards } from '../../data/cards'

/**
 * Card reward generator:
 * - chooses 3 different cards via weighted sampling (poolFrequency)
 * - computes reward level from base (enemy level or game level) + luck
 * - rolls upgrades from reward level
 */
export function populateCardReward(args: Readonly<{
  rng: RngState
  baseRewardLevel: number
  luck: number
  count?: number
}>): { rng: RngState; offered: ReadonlyArray<Readonly<{ cardId: CardId; upgrades: number }>>; rewardLevel: number } {
  const count = Math.max(0, args.count ?? 3)
  const rewardLevel = Math.max(0, (args.baseRewardLevel | 0) + (args.luck | 0))

  // All cards (including starters) are eligible; poolFrequency controls likelihood.
  const pool: CardId[] = (Object.keys(Cards) as CardId[]).slice()

  let rng = args.rng
  const picked: CardId[] = []

  for (let i = 0; i < count; i++) {
    if (!pool.length) break

    const total = pool.reduce((acc, id) => acc + Math.max(0, Cards[id]?.poolFrequency ?? 0), 0)
    if (total <= 0) break

    const [r2, n] = rngInt(rng, 0, total)
    rng = r2

    let cursor = 0
    let chosen: CardId = pool[0]!
    for (const id of pool) {
      cursor += Math.max(0, Cards[id]?.poolFrequency ?? 0)
      if (n < cursor) {
        chosen = id
        break
      }
    }

    picked.push(chosen)
    const idx = pool.indexOf(chosen)
    if (idx >= 0) pool.splice(idx, 1)
  }

  // Upgrade curve: each 10 reward levels guarantees +1 upgrade, with fractional chance for the next.
  const offered = picked.map((cardId) => {
    const guaranteed = Math.floor(rewardLevel / 10)
    const frac = (rewardLevel % 10) / 10
    const [r2, u] = rngNext(rng)
    rng = r2
    const extra = u < frac ? 1 : 0
    return { cardId, upgrades: Math.max(0, guaranteed + extra) }
  })

  return { rng, offered, rewardLevel }
}

