/**
 * Dynamic fit for name and effect text on `.gameCard` (see cardTypography.css for base rules).
 * Keep in sync with `--card-font-scale-min` / `--card-font-scale-text-max` in tokens.css.
 */
const MIN_SCALE = 0.5
const TEXT_MAX_SCALE = 1.25
const SCALE_STEP = 0.05

export const CARD_FONT_SCALE_VARS = {
  name: '--card-font-scale-name',
  ink: '--card-font-scale-ink',
  text: '--card-font-scale-text',
} as const

export type CardFontScales = Readonly<{
  name: number
  ink: number
  text: number
}>

function regionOverflows(el: HTMLElement): boolean {
  return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
}

function nameRegionOverflows(nameEl: HTMLElement): boolean {
  if (regionOverflows(nameEl)) return true
  return [...nameEl.querySelectorAll<HTMLElement>('.gameCard__nameLine')].some(regionOverflows)
}

export function resetCardFontScales(card: HTMLElement): void {
  card.style.setProperty(CARD_FONT_SCALE_VARS.name, '1')
  card.style.setProperty(CARD_FONT_SCALE_VARS.ink, '1')
  card.style.setProperty(CARD_FONT_SCALE_VARS.text, '1')
}

/** Largest scale in [MIN_SCALE, 1] where this element fits its box. */
function fitRegion(
  card: HTMLElement,
  el: HTMLElement,
  cssVar: string,
  overflows: (el: HTMLElement) => boolean = regionOverflows,
): number {
  let scale = 1
  card.style.setProperty(cssVar, '1')
  if (!overflows(el)) return 1

  while (scale > MIN_SCALE) {
    scale = Math.max(MIN_SCALE, Math.round((scale - SCALE_STEP) * 100) / 100)
    card.style.setProperty(cssVar, String(scale))
    if (!overflows(el)) return scale
  }

  return MIN_SCALE
}

/** Grow text scale while it still fits each region and the desc max-height budget. */
function growTextRegions(
  card: HTMLElement,
  elements: ReadonlyArray<HTMLElement>,
  fromScale: number,
): number {
  if (!elements.length) return fromScale

  let scale = fromScale
  const primary = elements[0]!
  const maxHeightPx = Number.parseFloat(getComputedStyle(primary).maxHeight)
  const canGrowByHeight = Number.isFinite(maxHeightPx) && maxHeightPx > 0

  let maxScale = TEXT_MAX_SCALE
  if (canGrowByHeight && primary.scrollHeight > 0) {
    maxScale = Math.min(TEXT_MAX_SCALE, ((maxHeightPx / primary.scrollHeight) * scale * 0.98))
  }
  maxScale = Math.max(scale, maxScale)

  while (scale < maxScale) {
    const next = Math.min(maxScale, Math.round((scale + SCALE_STEP) * 100) / 100)
    card.style.setProperty(CARD_FONT_SCALE_VARS.text, String(next))
    if (elements.some(regionOverflows)) {
      card.style.setProperty(CARD_FONT_SCALE_VARS.text, String(scale))
      return scale
    }
    scale = next
  }

  return scale
}

/** Effects + tags share one text scale; shrink to fit, then grow into spare desc space. */
function fitTextRegions(card: HTMLElement, elements: ReadonlyArray<HTMLElement>): number {
  if (!elements.length) return 1

  let scale = 1
  card.style.setProperty(CARD_FONT_SCALE_VARS.text, '1')
  if (elements.some(regionOverflows)) {
    while (scale > MIN_SCALE) {
      scale = Math.max(MIN_SCALE, Math.round((scale - SCALE_STEP) * 100) / 100)
      card.style.setProperty(CARD_FONT_SCALE_VARS.text, String(scale))
      if (!elements.some(regionOverflows)) break
    }
  }

  return growTextRegions(card, elements, scale)
}

/** Fit name, ink, and effects text scales independently. */
export function fitCardFontScales(card: HTMLElement, overlay: HTMLElement): CardFontScales {
  resetCardFontScales(card)

  const nameEl = overlay.querySelector<HTMLElement>('.gameCard__name')
  const textEls = [...overlay.querySelectorAll<HTMLElement>('.gameCard__desc, .gameCard__tags')]

  const name = nameEl ? fitRegion(card, nameEl, CARD_FONT_SCALE_VARS.name, nameRegionOverflows) : 1
  // Ink always uses `--font-card-ink-size` at full scale; shrinking made costs look smaller than the token.
  card.style.setProperty(CARD_FONT_SCALE_VARS.ink, '1')
  const ink = 1
  const text = fitTextRegions(card, textEls)

  return { name, ink, text }
}
