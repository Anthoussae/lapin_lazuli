import { readRootDurationMs } from './relicTooltipPosition'

/** CSS custom properties for gem socket card flip FX (see tokens.css). */
export const CARD_SOCKET_FLIP_TOKEN = {
  perspective: '--card-socket-flip-perspective',
  flipHalf: '--duration-card-socket-flip-half',
  flipEase: '--ease-card-socket-flip',
  glow: '--duration-card-socket-flip-glow',
  glowEase: '--ease-card-socket-flip-glow',
  glowColor: '--card-socket-flip-glow-color',
  glowSpread: '--card-socket-flip-glow-spread',
  glowOpacityPeak: '--card-socket-flip-glow-opacity-peak',
  glowScalePeak: '--card-socket-flip-glow-scale-peak',
  buffer: '--duration-card-socket-flip-buffer',
  fxZ: '--card-socket-flip-fx-z',
} as const

/** Wall-clock duration: flip to back + flip to front + glow + buffer. */
export function cardSocketFlipTotalMs(): number {
  const t = CARD_SOCKET_FLIP_TOKEN
  const flipHalfMs = readRootDurationMs(t.flipHalf) || 280
  const glowMs = readRootDurationMs(t.glow) || 520
  const bufferMs = readRootDurationMs(t.buffer) || 48
  return flipHalfMs * 2 + glowMs + bufferMs
}
