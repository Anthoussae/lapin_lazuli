import { hoverTooltipAnchorRect } from './hoverTooltipAnchorRect'

/** Read a px-valued custom property from :root (e.g. `-8px` → -8). */
export function readRootPxVar(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return Number.parseFloat(raw) || 0
}

/** Read a time-valued custom property from :root (e.g. `58ms` → 58, `0.5s` → 500). */
export function readRootDurationMs(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (raw.endsWith('ms')) return Number.parseFloat(raw) || 0
  if (raw.endsWith('s')) return (Number.parseFloat(raw) || 0) * 1000
  return Number.parseFloat(raw) || 0
}

/** Read a unitless or suffixed numeric custom property from :root (e.g. `0.6`, `36deg` → 36). */
export function readRootNumber(name: string, fallback = 0): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

/** Viewport coordinates for a relic-styled tooltip (no hover-scale adjustment). */
export function relicTooltipViewportPosition(rect: DOMRect): { x: number; y: number } {
  const nudgeX = readRootPxVar('--relic-tooltip-nudge-x')
  const nudgeY = readRootPxVar('--relic-tooltip-nudge-y')
  const gap = readRootPxVar('--relic-tooltip-gap') || 4
  return iconTooltipViewportPosition(rect, { gap, nudgeX, nudgeY })
}

function relicIconHoverScale(element: HTMLElement): number {
  const inherited = getComputedStyle(element).getPropertyValue('--relic-icon-hover-scale').trim()
  const n = Number.parseFloat(inherited)
  if (Number.isFinite(n) && n > 0) return n
  return readRootNumber('--relic-icon-hover-scale', 1)
}

/** Relic icon tooltip — anchored as if the icon is at full hover scale. */
export function relicIconTooltipViewportPosition(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect()
  const anchor = hoverTooltipAnchorRect(element, rect, relicIconHoverScale(element))
  return relicTooltipViewportPosition(anchor)
}

/** Gem icon tooltip — anchored as if the scaled visual is at full hover scale. */
export function gemIconTooltipViewportPosition(element: HTMLElement): { x: number; y: number } {
  const nudgeX = readRootPxVar('--gem-tooltip-nudge-x')
  const nudgeY = readRootPxVar('--gem-tooltip-nudge-y')
  const gap = readRootPxVar('--gem-tooltip-gap') || 4
  const hoverScale = readRootNumber('--gem-icon-hover-scale', 1)
  const anchor = hoverTooltipAnchorRect(element, element.getBoundingClientRect(), hoverScale)
  return iconTooltipViewportPosition(anchor, { gap, nudgeX, nudgeY })
}

function iconTooltipViewportPosition(
  rect: DOMRect,
  opts: Readonly<{ gap: number; nudgeX: number; nudgeY: number }>,
): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2 + opts.nudgeX,
    y: rect.bottom + opts.gap + opts.nudgeY,
  }
}
