import { readRootDurationMs } from './relicTooltipPosition'

/** CSS custom properties for collector bulk card preview (see tokens.css). */
export const COLLECTOR_BULK_TOKEN = {
  card0X: '--collector-bulk-card-0-x',
  card0Y: '--collector-bulk-card-0-y',
  card1X: '--collector-bulk-card-1-x',
  card1Y: '--collector-bulk-card-1-y',
  cardScale: '--collector-bulk-card-scale',
  cardZ: '--collector-bulk-card-z-index',
  previewHold: '--duration-collector-bulk-card-preview-hold',
} as const

export function collectorBulkPreviewHoldMs(): number {
  return readRootDurationMs(COLLECTOR_BULK_TOKEN.previewHold) || 700
}
