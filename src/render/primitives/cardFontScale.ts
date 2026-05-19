/** Keep in sync with `--card-font-scale-min` in tokens.css. */
const MIN_SCALE = 0.5
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

function overlayOverflows(overlay: HTMLElement): boolean {
  return overlay.scrollHeight > overlay.clientHeight + 1
}

export function resetCardFontScales(card: HTMLElement): void {
  card.style.setProperty(CARD_FONT_SCALE_VARS.name, '1')
  card.style.setProperty(CARD_FONT_SCALE_VARS.ink, '1')
  card.style.setProperty(CARD_FONT_SCALE_VARS.text, '1')
}

/** Largest scale in [MIN_SCALE, 1] where this element fits its box. */
function fitRegion(card: HTMLElement, el: HTMLElement, cssVar: string): number {
  let scale = 1
  card.style.setProperty(cssVar, '1')
  if (!regionOverflows(el)) return 1

  while (scale > MIN_SCALE) {
    scale = Math.max(MIN_SCALE, Math.round((scale - SCALE_STEP) * 100) / 100)
    card.style.setProperty(cssVar, String(scale))
    if (!regionOverflows(el)) return scale
  }

  return MIN_SCALE
}

/** Effects + tags share one text scale; shrink until every text region fits. */
function fitTextRegions(card: HTMLElement, elements: ReadonlyArray<HTMLElement>): number {
  if (!elements.length) return 1

  let scale = 1
  card.style.setProperty(CARD_FONT_SCALE_VARS.text, '1')
  const anyOverflow = () => elements.some(regionOverflows)
  if (!anyOverflow()) return 1

  while (scale > MIN_SCALE) {
    scale = Math.max(MIN_SCALE, Math.round((scale - SCALE_STEP) * 100) / 100)
    card.style.setProperty(CARD_FONT_SCALE_VARS.text, String(scale))
    if (!anyOverflow()) return scale
  }

  return MIN_SCALE
}

/** Fit name, ink, and effects text scales independently. */
export function fitCardFontScales(card: HTMLElement, overlay: HTMLElement): CardFontScales {
  resetCardFontScales(card)

  const nameEl = overlay.querySelector<HTMLElement>('.gameCard__name')
  const textEls = [...overlay.querySelectorAll<HTMLElement>('.gameCard__desc, .gameCard__tags')]

  const name = nameEl ? fitRegion(card, nameEl, CARD_FONT_SCALE_VARS.name) : 1
  // Ink always uses `--font-card-ink-size` at full scale; shrinking made costs look smaller than the token.
  card.style.setProperty(CARD_FONT_SCALE_VARS.ink, '1')
  const ink = 1
  let text = fitTextRegions(card, textEls)

  // If fixed header/footer still crowd the card, shrink effects text only.
  while (overlayOverflows(overlay) && text > MIN_SCALE) {
    text = Math.max(MIN_SCALE, Math.round((text - SCALE_STEP) * 100) / 100)
    card.style.setProperty(CARD_FONT_SCALE_VARS.text, String(text))
  }

  return { name, ink, text }
}
