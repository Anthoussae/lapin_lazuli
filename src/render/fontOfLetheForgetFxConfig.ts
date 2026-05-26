import { readRootDurationMs, readRootNumber } from './relicTooltipPosition'

/** CSS custom properties for Font-of-Lethe forget FX (see tokens.css). */
export const FONT_OF_LETHE_FORGET_FX_TOKEN = {
  deckGlowDuration: '--duration-font-of-lethe-forget-deck-glow',
  consumeDelay: '--duration-font-of-lethe-forget-consume-delay',
  poofX: '--font-of-lethe-forget-poof-x',
  poofY: '--font-of-lethe-forget-poof-y',
} as const

export function fontOfLetheForgetDeckGlowMs(): number {
  return readRootDurationMs(FONT_OF_LETHE_FORGET_FX_TOKEN.deckGlowDuration) || 420
}

export function fontOfLetheForgetConsumeDelayMs(): number {
  return readRootDurationMs(FONT_OF_LETHE_FORGET_FX_TOKEN.consumeDelay) || 0
}

export function fontOfLetheForgetPoofViewportPoint(): { x: number; y: number } {
  // Interpret x/y as viewport percentage (0–100). (e.g. 50 = center)
  const xPct = readRootNumber(FONT_OF_LETHE_FORGET_FX_TOKEN.poofX, 50)
  const yPct = readRootNumber(FONT_OF_LETHE_FORGET_FX_TOKEN.poofY, 50)
  return { x: (window.innerWidth * xPct) / 100, y: (window.innerHeight * yPct) / 100 }
}

