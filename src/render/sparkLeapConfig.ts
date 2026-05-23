import { fireReleaseTotalMs } from './fireReleaseConfig'
import { readRootDurationMs, readRootNumber, readRootPxVar } from './relicTooltipPosition'

/** CSS custom properties for leaping sparks during fire release (see tokens.css). */
export const SPARK_LEAP_TOKEN = {
  spawnCenterX: '--spark-leap-spawn-center-x',
  spawnCenterY: '--spark-leap-spawn-center-y',
  scatterX: '--spark-leap-scatter-x',
  scatterY: '--spark-leap-scatter-y',
  size: '--spark-leap-size',
  arcMin: '--spark-leap-arc-min',
  arcMax: '--spark-leap-arc-max',
  apexMin: '--spark-leap-apex-min',
  apexMax: '--spark-leap-apex-max',
  travelDuration: '--duration-spark-release-leap',
  landPuffDistanceMin: '--spark-leap-land-puff-distance-min',
  landPuffDistanceMax: '--spark-leap-land-puff-distance-max',
  landPuffDurationMin: '--spark-leap-land-puff-duration-min',
  landPuffDurationMax: '--spark-leap-land-puff-duration-max',
} as const

export type SparkLeapLandPuffConfig = Readonly<{
  distanceMinPx: number
  distanceMaxPx: number
  durationMinMs: number
  durationMaxMs: number
}>

const LAND_PUFF_FALLBACK: SparkLeapLandPuffConfig = {
  distanceMinPx: 50,
  distanceMaxPx: 100,
  durationMinMs: 50,
  durationMaxMs: 100,
}

export type SparkLeapConfig = Readonly<{
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

const FALLBACK: SparkLeapConfig = {
  spawnCenterX: 0,
  spawnCenterY: 0,
  scatterX: 36,
  scatterY: 28,
  sizePx: 40,
  arcMin: 2,
  arcMax: 5,
  apexMinPx: 22,
  apexMaxPx: 64,
  travelDurationMs: 180,
}

/** Layout and motion knobs for one leaping spark. */
export function readSparkLeapConfig(): SparkLeapConfig {
  const t = SPARK_LEAP_TOKEN
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

/** Spark burst when a leaping spark reaches the enemy. */
export function readSparkLeapLandPuffConfig(): SparkLeapLandPuffConfig {
  const t = SPARK_LEAP_TOKEN
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

/** Hold before FX cleanup: burst poof window + last leap flight + land puff. */
export function fireReleaseFxHoldMs(sparkCount: number): number {
  const poofMs = fireReleaseTotalMs()
  if (sparkCount <= 0) return poofMs
  const tickMs = poofMs / sparkCount
  const leap = readSparkLeapConfig()
  const land = readSparkLeapLandPuffConfig()
  const lastLeapDoneMs = (sparkCount - 1) * tickMs + leap.travelDurationMs + land.durationMaxMs
  return Math.max(poofMs, lastLeapDoneMs + 32)
}
