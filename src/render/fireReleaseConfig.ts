import { FIRE_RELEASE_SPRITE_MAX } from '../systems/cards/fireRelease'
import { readRootDurationMs, readRootNumber, readRootPxVar } from './relicTooltipPosition'

/** CSS custom property names for the fire-release animation (see tokens.css). */
export const FIRE_RELEASE_TOKEN = {
  anchorX: '--fire-release-anchor-x',
  anchorY: '--fire-release-anchor-y',
  spriteMax: '--fire-release-sprite-max',
  spreadBase: '--fire-release-spread-base',
  spreadRange: '--fire-release-spread-range',
  spreadYMin: '--fire-release-spread-y-min',
  spreadYRange: '--fire-release-spread-y-range',
  driftScaleMin: '--fire-release-drift-scale-min',
  driftScaleRange: '--fire-release-drift-scale-range',
  driftXMax: '--fire-release-drift-x-max',
  driftYBase: '--fire-release-drift-y-base',
  driftYRange: '--fire-release-drift-y-range',
  rotMax: '--fire-release-rot-max',
  scaleMin: '--fire-release-scale-min',
  scaleRange: '--fire-release-scale-range',
  delaySteps: '--fire-release-delay-steps',
  delayStep: '--fire-release-delay-step',
  buffer: '--duration-fire-release-buffer',
  fade: '--duration-vanish-puff-fade',
  sparkHeight: '--fire-release-spark-height',
  fxZ: '--fire-release-fx-z',
} as const

export type FireReleaseParticleConfig = Readonly<{
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

const FALLBACK: FireReleaseParticleConfig = {
  spreadBase: 56,
  spreadRange: 32,
  spreadYMin: 0.55,
  spreadYRange: 0.35,
  driftScaleMin: 0.9,
  driftScaleRange: 0.5,
  driftXMax: 36,
  driftYBase: 14,
  driftYRange: 28,
  rotMax: 42,
  scaleMin: 0.5,
  scaleRange: 0.5,
  delaySteps: 5,
  delayStepMs: 35,
}

/** Horizontal offset of the burst anchor from the player placeholder center. */
export function readFireReleaseAnchorXOffset(): number {
  return readRootPxVar(FIRE_RELEASE_TOKEN.anchorX)
}

/** Vertical offset of the burst anchor from the player placeholder center (negative = up). */
export function readFireReleaseAnchorYOffset(): number {
  return readRootPxVar(FIRE_RELEASE_TOKEN.anchorY)
}

/** Max spark sprites shown for one release (see `--fire-release-sprite-max`). */
export function readFireReleaseSpriteMax(): number {
  return Math.max(1, Math.round(readRootNumber(FIRE_RELEASE_TOKEN.spriteMax, FIRE_RELEASE_SPRITE_MAX)))
}

/** Particle layout/randomness knobs for one fire-release burst. */
export function readFireReleaseParticleConfig(): FireReleaseParticleConfig {
  const t = FIRE_RELEASE_TOKEN
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

/** Wall-clock duration before the burst host is removed (fade + max stagger + buffer). */
export function fireReleaseTotalMs(): number {
  const t = FIRE_RELEASE_TOKEN
  const cfg = readFireReleaseParticleConfig()
  const fadeMs = readRootDurationMs(t.fade) || 550
  const bufferMs = readRootDurationMs(t.buffer) || 60
  const maxDelayMs = Math.max(0, cfg.delaySteps - 1) * cfg.delayStepMs
  return fadeMs + maxDelayMs + bufferMs
}
