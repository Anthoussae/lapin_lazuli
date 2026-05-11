import type { RelicId } from '../../core/types/ids'
import type { ShopStockRow } from './populateShop'

/**
 * Fired when shop item prices are about to be rolled (extend for discount relics, price modifiers, etc.).
 */
export type AssignShopPricesTriggerContext = Readonly<{
  stock: ReadonlyArray<ShopStockRow>
  ownedRelicTemplateIds: ReadonlySet<RelicId>
  playerGold: number
  level: number
}>

/**
 * Placeholder for relics/effects that react to shop price assignment.
 * Call once at the start of {@link assignShopPrices}; actual discounts can adjust `items` later.
 */
export function notifyAssignShopPricesTriggers(_ctx: AssignShopPricesTriggerContext): void {
  void _ctx
}
