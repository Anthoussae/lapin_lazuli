import { readRootDurationMs, readRootPxVar } from './relicTooltipPosition'

/** Critical hit FX (see tokens.css --critical-fx-*). */
export const CRITICAL_FX_TOKEN = {
  fadeDuration: '--duration-critical-fx-fade',
  shakeDuration: '--duration-critical-fx-shake',
  fontSize: '--critical-fx-font-size',
  driftY: '--critical-fx-drift-y',
  offsetX: '--critical-fx-offset-x',
  offsetY: '--critical-fx-offset-y',
  shakeX: '--critical-fx-shake-x',
  shakeY: '--critical-fx-shake-y',
  glowSpread: '--critical-fx-glow-spread',
  attackColor: '--critical-fx-attack-color',
  bunniesColor: '--critical-fx-bunnies-color',
  shieldColor: '--critical-fx-shield-color',
  attackGlow: '--critical-fx-attack-glow',
  bunniesGlow: '--critical-fx-bunnies-glow',
  shieldGlow: '--critical-fx-shield-glow',
  ease: '--ease-critical-fx',
} as const

export function criticalFxFadeDurationMs(): number {
  return readRootDurationMs(CRITICAL_FX_TOKEN.fadeDuration) || 250
}

export function criticalFxShakeDurationMs(): number {
  return readRootDurationMs(CRITICAL_FX_TOKEN.shakeDuration) || 250
}

export function criticalFxFontSizePx(): number {
  return readRootPxVar(CRITICAL_FX_TOKEN.fontSize) || 48
}

export function criticalFxDriftYPx(): number {
  return readRootPxVar(CRITICAL_FX_TOKEN.driftY) || -48
}

export function criticalFxOffsetX(): number {
  return readRootPxVar(CRITICAL_FX_TOKEN.offsetX)
}

export function criticalFxOffsetY(): number {
  return readRootPxVar(CRITICAL_FX_TOKEN.offsetY)
}

export function criticalFxTotalMs(): number {
  return Math.max(criticalFxFadeDurationMs(), criticalFxShakeDurationMs()) + 40
}
