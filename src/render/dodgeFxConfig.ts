import { readRootDurationMs, readRootPxVar } from './relicTooltipPosition'

/** Player dodge FX (see tokens.css --dodge-fx-*). */
export const DODGE_FX_TOKEN = {
  fadeDuration: '--duration-dodge-fx-fade',
  wiggleDuration: '--duration-dodge-fx-wiggle',
  ease: '--ease-dodge-fx',
  fontSize: '--dodge-fx-font-size',
  driftY: '--dodge-fx-drift-y',
  offsetX: '--dodge-fx-offset-x',
  offsetY: '--dodge-fx-offset-y',
  wiggleX: '--dodge-fx-wiggle-x',
  textColor: '--dodge-fx-text-color',
  textGlow: '--dodge-fx-text-glow',
  z: '--dodge-fx-z',
} as const

export const DODGE_FX_LABEL = 'Dodged!'

export function dodgeFxFadeDurationMs(): number {
  return readRootDurationMs(DODGE_FX_TOKEN.fadeDuration) || 500
}

export function dodgeFxWiggleDurationMs(): number {
  return readRootDurationMs(DODGE_FX_TOKEN.wiggleDuration) || 500
}

export function dodgeFxFontSizePx(): number {
  return readRootPxVar(DODGE_FX_TOKEN.fontSize) || 40
}

export function dodgeFxDriftYPx(): number {
  return readRootPxVar(DODGE_FX_TOKEN.driftY) || -56
}

export function dodgeFxOffsetX(): number {
  return readRootPxVar(DODGE_FX_TOKEN.offsetX)
}

export function dodgeFxOffsetY(): number {
  return readRootPxVar(DODGE_FX_TOKEN.offsetY)
}

export function dodgeFxTotalMs(): number {
  return Math.max(dodgeFxFadeDurationMs(), dodgeFxWiggleDurationMs()) + 40
}
