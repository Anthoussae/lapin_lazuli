import { readRootDurationMs } from './relicTooltipPosition'

/** CSS custom properties for trigger FX (see tokens.css). */
export const TRIGGER_FX_TOKEN = {
  duration: '--duration-trigger-fx',
  ease: '--ease-trigger-fx',
  targetDelay: '--delay-trigger-fx-target',
  sourceGlow: '--color-trigger-fx-source-glow',
  sourceGlowSoft: '--color-trigger-fx-source-glow-soft',
  sourceShakeX: '--trigger-fx-source-shake-x',
  sourceShakeY: '--trigger-fx-source-shake-y',
  buffGlow: '--color-trigger-fx-buff-glow',
  buffGlowSoft: '--color-trigger-fx-buff-glow-soft',
  buffScalePeak: '--trigger-fx-buff-scale-peak',
  debuffGlow: '--color-trigger-fx-debuff-glow',
  debuffGlowSoft: '--color-trigger-fx-debuff-glow-soft',
  debuffWiggleDeg: '--trigger-fx-debuff-wiggle-deg',
  glowTight: '--trigger-fx-glow-tight',
  glowWide: '--trigger-fx-glow-wide',
} as const

const FALLBACK_DURATION_MS = 380
const FALLBACK_TARGET_DELAY_MS = 60

/** Wall-clock hold until all role animations finish (source + staggered target). */
export function triggerFxTotalMs(): number {
  const duration = readRootDurationMs(TRIGGER_FX_TOKEN.duration) || FALLBACK_DURATION_MS
  const targetDelay = readRootDurationMs(TRIGGER_FX_TOKEN.targetDelay) || FALLBACK_TARGET_DELAY_MS
  return duration + targetDelay
}
