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

/** Viewport coordinates for a relic tooltip anchored below the icon center. */
export function relicTooltipViewportPosition(rect: DOMRect): { x: number; y: number } {
  const nudgeX = readRootPxVar('--relic-tooltip-nudge-x')
  const nudgeY = readRootPxVar('--relic-tooltip-nudge-y')
  const gap = readRootPxVar('--relic-tooltip-gap') || 4
  return iconTooltipViewportPosition(rect, { gap, nudgeX, nudgeY })
}

/** Viewport coordinates for a gem tooltip anchored below the icon center. */
export function gemTooltipViewportPosition(rect: DOMRect): { x: number; y: number } {
  const nudgeX = readRootPxVar('--gem-tooltip-nudge-x')
  const nudgeY = readRootPxVar('--gem-tooltip-nudge-y')
  const gap = readRootPxVar('--gem-tooltip-gap') || 4
  return iconTooltipViewportPosition(rect, { gap, nudgeX, nudgeY })
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
