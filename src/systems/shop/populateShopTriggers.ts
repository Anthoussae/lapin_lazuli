import type { RelicId } from '../../core/types/ids'

/** Inputs available when generating shop stock (extend as needed for future relic hooks). */
export type PopulateShopTriggerContext = Readonly<{
  level: number
  luck: number
  ownedRelicTemplateIds: ReadonlySet<RelicId>
}>

/**
 * Placeholder for relics/effects that react to shop population.
 * Call once at the start of {@link populateShop}; wire relic triggers here later.
 */
export function notifyPopulateShopTriggers(_ctx: PopulateShopTriggerContext): void {
  void _ctx
}
