import { bunnyReleaseTotalMs } from './bunnyReleaseConfig'
import { readRootDurationMs, readRootNumber, readRootPxVar } from './relicTooltipPosition'

/** CSS custom properties for leaping bunnies during release tick-down (see tokens.css). */
export const BUNNY_LEAP_TOKEN = {
  spawnCenterX: '--bunny-leap-spawn-center-x',
  spawnCenterY: '--bunny-leap-spawn-center-y',
  scatterX: '--bunny-leap-scatter-x',
  scatterY: '--bunny-leap-scatter-y',
  size: '--bunny-leap-size',
  arcMin: '--bunny-leap-arc-min',
  arcMax: '--bunny-leap-arc-max',
  apexMin: '--bunny-leap-apex-min',
  apexMax: '--bunny-leap-apex-max',
  travelDuration: '--duration-bunny-release-leap',
  landPuffDistanceMin: '--bunny-leap-land-puff-distance-min',
  landPuffDistanceMax: '--bunny-leap-land-puff-distance-max',
  landPuffDurationMin: '--bunny-leap-land-puff-duration-min',
  landPuffDurationMax: '--bunny-leap-land-puff-duration-max',
} as const

export type BunnyLeapLandPuffConfig = Readonly<{
  distanceMinPx: number
  distanceMaxPx: number
  durationMinMs: number
  durationMaxMs: number
}>

const LAND_PUFF_FALLBACK: BunnyLeapLandPuffConfig = {
  distanceMinPx: 50,
  distanceMaxPx: 100,
  durationMinMs: 50,
  durationMaxMs: 100,
}

export type BunnyLeapConfig = Readonly<{
  spawnCenterX: number
  spawnCenterY: number
  scatterX: number
  scatterY: number
  sizePx: number
  arcMin: number
  arcMax: number
  apexMinPx: number
  apexMaxPx: number
  travelDurationMs: number
}>

const FALLBACK: BunnyLeapConfig = {
  spawnCenterX: 0,
  spawnCenterY: -40,
  scatterX: 36,
  scatterY: 28,
  sizePx: 40,
  arcMin: 3,
  arcMax: 5,
  apexMinPx: 32,
  apexMaxPx: 64,
  travelDurationMs: 180,
}

/** Layout and motion knobs for one leaping bunny. */
export function readBunnyLeapConfig(): BunnyLeapConfig {
  const t = BUNNY_LEAP_TOKEN
  const arcMin = Math.max(1, Math.round(readRootNumber(t.arcMin, FALLBACK.arcMin)))
  const arcMax = Math.max(arcMin, Math.round(readRootNumber(t.arcMax, FALLBACK.arcMax)))
  const apexMinPx = readRootPxVar(t.apexMin) || FALLBACK.apexMinPx
  const apexMaxPx = Math.max(apexMinPx, readRootPxVar(t.apexMax) || FALLBACK.apexMaxPx)
  return {
    spawnCenterX: readRootPxVar(t.spawnCenterX) || FALLBACK.spawnCenterX,
    spawnCenterY: readRootPxVar(t.spawnCenterY) || FALLBACK.spawnCenterY,
    scatterX: readRootPxVar(t.scatterX) || FALLBACK.scatterX,
    scatterY: readRootPxVar(t.scatterY) || FALLBACK.scatterY,
    sizePx: readRootPxVar(t.size) || FALLBACK.sizePx,
    arcMin,
    arcMax,
    apexMinPx,
    apexMaxPx,
    travelDurationMs: readRootDurationMs(t.travelDuration) || FALLBACK.travelDurationMs,
  }
}

/** Tinypoof burst when a leaping bunny reaches its target. */
export function readBunnyLeapLandPuffConfig(): BunnyLeapLandPuffConfig {
  const t = BUNNY_LEAP_TOKEN
  const distanceMinPx = readRootPxVar(t.landPuffDistanceMin) || LAND_PUFF_FALLBACK.distanceMinPx
  const distanceMaxPx = Math.max(
    distanceMinPx,
    readRootPxVar(t.landPuffDistanceMax) || LAND_PUFF_FALLBACK.distanceMaxPx,
  )
  const durationMinMs = readRootDurationMs(t.landPuffDurationMin) || LAND_PUFF_FALLBACK.durationMinMs
  const durationMaxMs = Math.max(
    durationMinMs,
    readRootDurationMs(t.landPuffDurationMax) || LAND_PUFF_FALLBACK.durationMaxMs,
  )
  return { distanceMinPx, distanceMaxPx, durationMinMs, durationMaxMs }
}

/** Hold before turn resolution: cauldron poof window + last leap flight + land puff. */
export function bunnyReleaseFxHoldMs(bunnyCount: number): number {
  const poofMs = bunnyReleaseTotalMs()
  if (bunnyCount <= 0) return poofMs
  const tickMs = poofMs / bunnyCount
  const leap = readBunnyLeapConfig()
  const land = readBunnyLeapLandPuffConfig()
  const lastLeapDoneMs = (bunnyCount - 1) * tickMs + leap.travelDurationMs + land.durationMaxMs
  return Math.max(poofMs, lastLeapDoneMs + 32)
}
