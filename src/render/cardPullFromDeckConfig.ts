import { readRootDurationMs } from './relicTooltipPosition'

/** CSS custom properties for pull-from-deck card travel (see tokens.css). */
export const CARD_PULL_FROM_DECK_TOKEN = {
  travel: '--duration-pull-from-deck-travel',
  flip: '--duration-pull-from-deck-flip',
  finishBuffer: '--duration-pull-from-deck-finish-buffer',
  travelEase: '--ease-pull-from-deck-travel',
  flipEase: '--ease-pull-from-deck-flip',
  perspective: '--pull-from-deck-perspective',
  flyerZ: '--pull-from-deck-flyer-z',
  originScale: '--pull-from-deck-origin-scale',
  originRotate: '--pull-from-deck-origin-rotate',
  destScale: '--pull-from-deck-dest-scale',
  destRotate: '--pull-from-deck-dest-rotate',
} as const

/** Wall-clock duration: travel + flip + buffer (matches CardTravelProvider fallback timer). */
export function pullFromDeckTotalMs(): number {
  const t = CARD_PULL_FROM_DECK_TOKEN
  const travelMs = readRootDurationMs(t.travel) || 158
  const flipMs = readRootDurationMs(t.flip) || 152
  const bufferMs = readRootDurationMs(t.finishBuffer) || 10
  return travelMs + flipMs + bufferMs
}
