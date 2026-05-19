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

/** Viewport coordinates for a relic tooltip anchored below the icon center. */
export function relicTooltipViewportPosition(rect: DOMRect): { x: number; y: number } {
  const nudgeX = readRootPxVar('--relic-tooltip-nudge-x')
  const nudgeY = readRootPxVar('--relic-tooltip-nudge-y')
  const gap = readRootPxVar('--relic-tooltip-gap') || 4
  return {
    x: rect.left + rect.width / 2 + nudgeX,
    y: rect.bottom + gap + nudgeY,
  }
}
