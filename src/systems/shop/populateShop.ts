import type { CardId, RelicId } from '../../core/types/ids'
import type { RngState } from '../../core/rng/rng'
import { rngInt } from '../../core/rng/rng'
import { Cards } from '../../data/cards'
import { offerableRelicIds, shopOfferableRelicIds } from '../../data/relics'
import { notifyPopulateShopTriggers } from './populateShopTriggers'
import { rollShopCardUpgrades } from './rollShopCardUpgrades'

/** Fallback relic when no other offerable relic can fill a slot (see data/relics `BANANA`). */
const SHOP_FALLBACK_RELIC: RelicId = 'BANANA'

/** One row of stock before prices are assigned (3 relics + 5 cards + 1 key). */
export type ShopStockRow =
  | { kind: 'RELIC'; relicId: RelicId }
  | { kind: 'CARD'; cardId: CardId; upgrades: number }
  | { kind: 'KEY' }

export type PickThreeShopRelicsOptions = Readonly<{
  /** When true, use {@link shopOfferableRelicIds} (shop relic row only). Default: full {@link offerableRelicIds}. */
  shopStock?: boolean
}>

/**
 * Picks three relic offers (shop row when `shopStock`, else any offerable pool). Used by {@link populateShop},
 * treasure room, and miniboss relic drafts.
 */
export function pickThreeShopRelics(
  rng: RngState,
  ownedRelicTemplateIds: ReadonlySet<RelicId>,
  opts?: PickThreeShopRelicsOptions,
): { rng: RngState; relicIds: RelicId[] } {
  const offerable = opts?.shopStock
    ? shopOfferableRelicIds(ownedRelicTemplateIds)
    : offerableRelicIds(ownedRelicTemplateIds)
  let primaryLeft = offerable.filter((id) => id !== SHOP_FALLBACK_RELIC)
  const relicIds: RelicId[] = []
  let r = rng

  for (let slot = 0; slot < 3; slot++) {
    if (primaryLeft.length > 0) {
      const [r2, idx] = rngInt(r, 0, primaryLeft.length)
      r = r2
      relicIds.push(primaryLeft.splice(idx, 1)[0]!)
    } else if (offerable.includes(SHOP_FALLBACK_RELIC)) {
      relicIds.push(SHOP_FALLBACK_RELIC)
    } else if (offerable.length > 0) {
      const [r2, idx] = rngInt(r, 0, offerable.length)
      r = r2
      relicIds.push(offerable[idx]!)
    } else {
      break
    }
  }

  return { rng: r, relicIds }
}

/**
 * Shop inventory: 3 relics (distinct when possible; Banana only when no other relic can fill a slot), 5 distinct cards
 * weighted by {@link Cards}[id].poolFrequency, and 1 key offer. Card upgrades use {@link rollShopCardUpgrades}.
 */
export function populateShop(
  rng: RngState,
  ownedRelicTemplateIds: ReadonlySet<RelicId>,
  level: number,
  luck: number,
): { rng: RngState; stock: ShopStockRow[] } {
  notifyPopulateShopTriggers({ level, luck, ownedRelicTemplateIds })

  let r = rng
  const relicPick = pickThreeShopRelics(r, ownedRelicTemplateIds, { shopStock: true })
  r = relicPick.rng

  const cardPool: CardId[] = (Object.keys(Cards) as CardId[]).slice()
  const cardRows: ShopStockRow[] = []

  for (let i = 0; i < 5 && cardPool.length > 0; i++) {
    const total = cardPool.reduce((acc, id) => acc + Math.max(0, Cards[id]?.poolFrequency ?? 0), 0)
    if (total <= 0) break

    const [r2, n] = rngInt(r, 0, total)
    r = r2

    let cursor = 0
    let chosen: CardId = cardPool[0]!
    for (const id of cardPool) {
      cursor += Math.max(0, Cards[id]?.poolFrequency ?? 0)
      if (n < cursor) {
        chosen = id
        break
      }
    }

    const idx = cardPool.indexOf(chosen)
    if (idx >= 0) cardPool.splice(idx, 1)

    const upOut = rollShopCardUpgrades(r, level, luck)
    r = upOut.rng
    cardRows.push({ kind: 'CARD', cardId: chosen, upgrades: upOut.upgrades })
  }

  const stock: ShopStockRow[] = [
    ...relicPick.relicIds.map((relicId) => ({ kind: 'RELIC' as const, relicId })),
    ...cardRows,
    { kind: 'KEY' as const },
  ]

  return { rng: r, stock }
}
