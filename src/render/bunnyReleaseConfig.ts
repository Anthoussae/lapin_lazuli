import { BUNNY_RELEASE_SPRITE_MAX } from '../systems/bunnies'
import { readRootDurationMs, readRootNumber, readRootPxVar } from './relicTooltipPosition'

/** CSS custom property names for the bunny-release animation (see tokens.css). */
export const BUNNY_RELEASE_TOKEN = {
  anchorY: '--bunny-release-anchor-y',
  spriteMax: '--bunny-release-sprite-max',
  spreadBase: '--bunny-release-spread-base',
  spreadRange: '--bunny-release-spread-range',
  spreadYMin: '--bunny-release-spread-y-min',
  spreadYRange: '--bunny-release-spread-y-range',
  driftScaleMin: '--bunny-release-drift-scale-min',
  driftScaleRange: '--bunny-release-drift-scale-range',
  driftXMax: '--bunny-release-drift-x-max',
  driftYBase: '--bunny-release-drift-y-base',
  driftYRange: '--bunny-release-drift-y-range',
  rotMax: '--bunny-release-rot-max',
  scaleMin: '--bunny-release-scale-min',
  scaleRange: '--bunny-release-scale-range',
  delaySteps: '--bunny-release-delay-steps',
  delayStep: '--bunny-release-delay-step',
  buffer: '--duration-bunny-release-buffer',
  fade: '--duration-vanish-puff-fade',
} as const

export type BunnyReleaseParticleConfig = Readonly<{
  spreadBase: number
  spreadRange: number
  spreadYMin: number
  spreadYRange: number
  driftScaleMin: number
  driftScaleRange: number
  driftXMax: number
  driftYBase: number
  driftYRange: number
  rotMax: number
  scaleMin: number
  scaleRange: number
  delaySteps: number
  delayStepMs: number
}>

const FALLBACK: BunnyReleaseParticleConfig = {
  spreadBase: 48,
  spreadRange: 26,
  spreadYMin: 0.6,
  spreadYRange: 0.3,
  driftScaleMin: 0.85,
  driftScaleRange: 0.55,
  driftXMax: 28,
  driftYBase: 12,
  driftYRange: 24,
  rotMax: 36,
  scaleMin: 0.55,
  scaleRange: 0.45,
  delaySteps: 5,
  delayStepMs: 35,
}

/** Vertical offset of the burst anchor from the cauldron center (negative = up). */
export function readBunnyReleaseAnchorYOffset(): number {
  return readRootPxVar(BUNNY_RELEASE_TOKEN.anchorY)
}

/** Max puff sprites shown for one release (see `--bunny-release-sprite-max`). */
export function readBunnyReleaseSpriteMax(): number {
  return Math.max(1, Math.round(readRootNumber(BUNNY_RELEASE_TOKEN.spriteMax, BUNNY_RELEASE_SPRITE_MAX)))
}

/** Particle layout/randomness knobs for one bunny-release burst. */
export function readBunnyReleaseParticleConfig(): BunnyReleaseParticleConfig {
  const t = BUNNY_RELEASE_TOKEN
  return {
    spreadBase: readRootPxVar(t.spreadBase) || FALLBACK.spreadBase,
    spreadRange: readRootPxVar(t.spreadRange) || FALLBACK.spreadRange,
    spreadYMin: readRootNumber(t.spreadYMin, FALLBACK.spreadYMin),
    spreadYRange: readRootNumber(t.spreadYRange, FALLBACK.spreadYRange),
    driftScaleMin: readRootNumber(t.driftScaleMin, FALLBACK.driftScaleMin),
    driftScaleRange: readRootNumber(t.driftScaleRange, FALLBACK.driftScaleRange),
    driftXMax: readRootPxVar(t.driftXMax) || FALLBACK.driftXMax,
    driftYBase: readRootPxVar(t.driftYBase) || FALLBACK.driftYBase,
    driftYRange: readRootPxVar(t.driftYRange) || FALLBACK.driftYRange,
    rotMax: readRootNumber(t.rotMax, FALLBACK.rotMax),
    scaleMin: readRootNumber(t.scaleMin, FALLBACK.scaleMin),
    scaleRange: readRootNumber(t.scaleRange, FALLBACK.scaleRange),
    delaySteps: Math.max(1, Math.round(readRootNumber(t.delaySteps, FALLBACK.delaySteps))),
    delayStepMs: readRootDurationMs(t.delayStep) || FALLBACK.delayStepMs,
  }
}

/** Wall-clock hold before turn resolution continues (fade + max stagger + buffer). */
export function bunnyReleaseTotalMs(): number {
  const t = BUNNY_RELEASE_TOKEN
  const cfg = readBunnyReleaseParticleConfig()
  const fadeMs = readRootDurationMs(t.fade) || 550
  const bufferMs = readRootDurationMs(t.buffer) || 60
  const maxDelayMs = Math.max(0, cfg.delaySteps - 1) * cfg.delayStepMs
  return fadeMs + maxDelayMs + bufferMs
}
