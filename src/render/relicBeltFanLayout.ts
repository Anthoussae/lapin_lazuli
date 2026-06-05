import type { CSSProperties } from 'react'
import { readRootPxVar } from './relicTooltipPosition'

/** Flex gap between relics at or below {@link RELIC_BELT_UNCOMPRESSED_MAX_COUNT}. */
export const RELIC_BELT_ROW_GAP_PX = 10

/** Horizontal overlap between adjacent belt relics when compressed (px). */
export const RELIC_BELT_FAN_OVERLAP_PX = 28

/** At or below this count, the belt uses normal flex gap. Above it, relics overlap. */
export const RELIC_BELT_UNCOMPRESSED_MAX_COUNT = 7

/** Icon width (px); keep in sync with `--relic-icon-height` in tokens.css. */
export const RELIC_BELT_ICON_WIDTH_PX = 94

/** Minimum visible width per icon when compressing a large belt (px). */
const RELIC_BELT_MIN_VISIBLE_ICON_PX = 14

/** Max horizontal scoot for the immediate neighbor of a hovered relic (px). */
export const RELIC_BELT_FAN_HOVER_SCOOT_PX = 44

/** How many slots on each side of the hover still shift (inclusive of immediate neighbor). */
export const RELIC_BELT_FAN_HOVER_SCOOT_RADIUS = 8

export type RelicBeltFanMetrics = Readonly<{
  overlapPx: number
}>

/** Horizontal span of overlapped relics (px). */
export function relicBeltFanSpanPx(
  count: number,
  overlapPx: number,
  iconWidthPx = RELIC_BELT_ICON_WIDTH_PX,
): number {
  if (count <= 0) return 0
  if (count === 1) return iconWidthPx
  return iconWidthPx + (count - 1) * (iconWidthPx - overlapPx)
}

function referenceUncompressedGapSpanPx(
  iconWidthPx = RELIC_BELT_ICON_WIDTH_PX,
  gapPx = RELIC_BELT_ROW_GAP_PX,
): number {
  const n = RELIC_BELT_UNCOMPRESSED_MAX_COUNT
  return n * iconWidthPx + (n - 1) * gapPx
}

/** Inner row width of the relic belt panel (px), from layout tokens. */
export function relicBeltInnerSpanCapPx(): number {
  if (typeof document === 'undefined') {
    return referenceUncompressedGapSpanPx()
  }
  const beltW = readRootPxVar('--relic-belt-width')
  const pad = readRootPxVar('--relic-belt-row-padding-x') * 2
  const inner = beltW - pad
  return inner > 0 ? inner : referenceUncompressedGapSpanPx()
}

/** Tighter overlap when {@link RELIC_BELT_UNCOMPRESSED_MAX_COUNT} is exceeded; fits the belt row. */
export function relicBeltFanMetrics(count: number, maxSpanPx?: number): RelicBeltFanMetrics {
  if (count <= RELIC_BELT_UNCOMPRESSED_MAX_COUNT) {
    return { overlapPx: 0 }
  }

  const iconW = RELIC_BELT_ICON_WIDTH_PX
  const spanCap = maxSpanPx ?? relicBeltInnerSpanCapPx()
  const targetSpan = Math.min(referenceUncompressedGapSpanPx(iconW), spanCap)
  const overlapPx = Math.min(
    iconW - RELIC_BELT_MIN_VISIBLE_ICON_PX,
    iconW - (targetSpan - iconW) / (count - 1),
  )

  return { overlapPx }
}

export function relicBeltUsesFanLayout(count: number): boolean {
  return count > RELIC_BELT_UNCOMPRESSED_MAX_COUNT
}

/** CSS variables for `.relicBeltRow--fan` based on relic count. */
export function relicBeltFanContainerStyle(count: number, maxSpanPx?: number): CSSProperties {
  const { overlapPx } = relicBeltFanMetrics(count, maxSpanPx)
  return {
    '--relic-belt-fan-overlap': `${overlapPx}px`,
  } as CSSProperties
}

export function relicBeltFanSlotZIndex(index: number): number {
  return index + 1
}

/** Horizontal shift so neighbors make room while a fan-layout relic is hovered. */
export function relicBeltFanHoverShiftPx(index: number, hoveredIndex: number | null): number {
  if (hoveredIndex === null || index === hoveredIndex) return 0

  const signedDist = index - hoveredIndex
  const dist = Math.abs(signedDist)
  if (dist > RELIC_BELT_FAN_HOVER_SCOOT_RADIUS) return 0

  const falloff = 1 - (dist - 1) / RELIC_BELT_FAN_HOVER_SCOOT_RADIUS
  const magnitude = RELIC_BELT_FAN_HOVER_SCOOT_PX * falloff
  return signedDist < 0 ? -magnitude : magnitude
}

export function relicBeltFanSlotStyle(
  index: number,
  count: number,
  hoveredIndex: number | null = null,
): CSSProperties {
  if (!relicBeltUsesFanLayout(count)) return {}

  const shiftPx = relicBeltFanHoverShiftPx(index, hoveredIndex)

  return {
    '--relic-belt-fan-z': String(relicBeltFanSlotZIndex(index)),
    '--relic-belt-fan-shift': `${shiftPx}px`,
  } as CSSProperties
}

/** Step from one belt icon to the next when fan layout is active (px). */
export function relicBeltFanSlotStepPx(count: number, maxSpanPx?: number): number {
  const { overlapPx } = relicBeltFanMetrics(count, maxSpanPx)
  return RELIC_BELT_ICON_WIDTH_PX - overlapPx
}
