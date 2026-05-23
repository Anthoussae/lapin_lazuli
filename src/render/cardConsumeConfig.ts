import { readRootDurationMs, readRootNumber, readRootPxVar } from './relicTooltipPosition'

/** CSS custom properties for card consume FX (see tokens.css). */
export const CARD_CONSUME_TOKEN = {
  puffCount: '--card-consume-puff-count',
  puffSpreadBase: '--card-consume-puff-spread-base',
  puffSpreadRange: '--card-consume-puff-spread-range',
  puffDriftMin: '--card-consume-puff-drift-min',
  puffDriftRange: '--card-consume-puff-drift-range',
  puffRotMax: '--card-consume-puff-rot-max',
  puffScaleMin: '--card-consume-puff-scale-min',
  puffScaleRange: '--card-consume-puff-scale-range',
  puffDelaySteps: '--card-consume-puff-delay-steps',
  puffDelayStep: '--card-consume-puff-delay-step',
  puffFade: '--duration-card-consume-puff-fade',
  aftermathW: '--card-consume-aftermath-w',
  aftermathH: '--card-consume-aftermath-h',
  aftermathDelay: '--card-consume-aftermath-delay',
  aftermathFade: '--duration-card-consume-aftermath-fade',
  buffer: '--duration-card-consume-buffer',
} as const

export type CardConsumeParticleConfig = Readonly<{
  puffCount: number
  spreadBase: number
  spreadRange: number
  driftMin: number
  driftRange: number
  rotMax: number
  scaleMin: number
  scaleRange: number
  delaySteps: number
  delayStepMs: number
}>

const PARTICLE_FALLBACK: CardConsumeParticleConfig = {
  puffCount: 6,
  spreadBase: 12,
  spreadRange: 18,
  driftMin: 36,
  driftRange: 44,
  rotMax: 48,
  scaleMin: 0.7,
  scaleRange: 0.35,
  delaySteps: 3,
  delayStepMs: 25,
}

/** Particle layout/randomness for one card-consume burst. */
export function readCardConsumeParticleConfig(): CardConsumeParticleConfig {
  const t = CARD_CONSUME_TOKEN
  return {
    puffCount: Math.max(1, Math.round(readRootNumber(t.puffCount, PARTICLE_FALLBACK.puffCount))),
    spreadBase: readRootPxVar(t.puffSpreadBase) || PARTICLE_FALLBACK.spreadBase,
    spreadRange: readRootPxVar(t.puffSpreadRange) || PARTICLE_FALLBACK.spreadRange,
    driftMin: readRootPxVar(t.puffDriftMin) || PARTICLE_FALLBACK.driftMin,
    driftRange: readRootPxVar(t.puffDriftRange) || PARTICLE_FALLBACK.driftRange,
    rotMax: readRootNumber(t.puffRotMax, PARTICLE_FALLBACK.rotMax),
    scaleMin: readRootNumber(t.puffScaleMin, PARTICLE_FALLBACK.scaleMin),
    scaleRange: readRootNumber(t.puffScaleRange, PARTICLE_FALLBACK.scaleRange),
    delaySteps: Math.max(1, Math.round(readRootNumber(t.puffDelaySteps, PARTICLE_FALLBACK.delaySteps))),
    delayStepMs: readRootDurationMs(t.puffDelayStep) || PARTICLE_FALLBACK.delayStepMs,
  }
}

/** Wall-clock hold before FX cleanup (puff fade + max stagger + aftermath + buffer). */
export function cardConsumeTotalMs(): number {
  const t = CARD_CONSUME_TOKEN
  const cfg = readCardConsumeParticleConfig()
  const puffFadeMs = readRootDurationMs(t.puffFade) || 420
  const aftermathDelayMs = readRootDurationMs(t.aftermathDelay) || 50
  const aftermathFadeMs = readRootDurationMs(t.aftermathFade) || 580
  const bufferMs = readRootDurationMs(t.buffer) || 32
  const maxPuffDelayMs = Math.max(0, cfg.delaySteps - 1) * cfg.delayStepMs
  return Math.max(puffFadeMs + maxPuffDelayMs, aftermathDelayMs + aftermathFadeMs) + bufferMs
}
