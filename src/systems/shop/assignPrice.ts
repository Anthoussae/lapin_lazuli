import type { ShopItem } from '../../core/types/state'
import type { RngState } from '../../core/rng/rng'
import { rngInt } from '../../core/rng/rng'
import { Cards } from '../../data/cards'
import type { ShopStockRow } from './populateShop'
import { notifyAssignShopPricesTriggers, type AssignShopPricesTriggerContext } from './assignShopPriceTriggers'

/**
 * Relics: random 80–150 gold. Cards: `2d6 + (20 - poolFrequency*2)` base, then `base * (upgrades + 1)`.
 * Keys: random 25–50 gold (inclusive).
 */
export function assignShopPrices(
  rng: RngState,
  stock: ReadonlyArray<ShopStockRow>,
  triggerCtx: AssignShopPricesTriggerContext,
): { rng: RngState; items: ShopItem[] } {
  notifyAssignShopPricesTriggers(triggerCtx)

  let r = rng
  const items: ShopItem[] = []

  for (const row of stock) {
    if (row.kind === 'RELIC') {
      const [r2, price] = rngInt(r, 80, 151)
      r = r2
      items.push({ kind: 'RELIC', relicId: row.relicId, price, sold: false })
    } else if (row.kind === 'KEY') {
      const [r2, price] = rngInt(r, 25, 51)
      r = r2
      items.push({ kind: 'KEY', price, sold: false })
    } else {
      const freq = Math.max(0, Cards[row.cardId]?.poolFrequency ?? 0)
      const [r1, a] = rngInt(r, 1, 7)
      r = r1
      const [r2, b] = rngInt(r, 1, 7)
      r = r2
      const rawBase = a + b + (20 - freq * 2)
      const basePrice = Math.max(1, rawBase)
      const price = basePrice * (row.upgrades + 1)
      items.push({ kind: 'CARD', cardId: row.cardId, upgrades: row.upgrades, price, sold: false })
    }
  }

  return { rng: r, items }
}
