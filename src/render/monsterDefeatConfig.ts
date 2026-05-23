import { readRootDurationMs, readRootNumber, readRootPxVar } from './relicTooltipPosition'

/** CSS custom property names for monster defeat FX (see tokens.css). */
export const MONSTER_DEFEAT_TOKEN = {
  duration: '--duration-monster-defeat',
  fallY: '--monster-defeat-fall-y',
  rotateDeg: '--monster-defeat-rotate-deg',
  glowColor: '--monster-defeat-glow-color',
  glowBlur: '--monster-defeat-glow-blur',
  glowArtSpread: '--monster-defeat-glow-art-spread',
  glowNameSpread: '--monster-defeat-glow-name-spread',
  poofHeight: '--monster-defeat-poof-height',
  poofFade: '--duration-monster-defeat-poof-fade',
  ease: '--ease-monster-defeat',
  z: '--monster-defeat-fx-z',
} as const

const FALLBACK_DURATION_MS = 1000
const FALLBACK_FALL_Y = 350
const FALLBACK_ROTATE_DEG = 30

/** Wall-clock defeat animation before reward transition or next combat action. */
export function monsterDefeatTotalMs(): number {
  return readRootDurationMs(MONSTER_DEFEAT_TOKEN.duration) || FALLBACK_DURATION_MS
}

export function readMonsterDefeatFallY(): number {
  return readRootPxVar(MONSTER_DEFEAT_TOKEN.fallY) || FALLBACK_FALL_Y
}

export function readMonsterDefeatRotateDeg(): number {
  return readRootNumber(MONSTER_DEFEAT_TOKEN.rotateDeg, FALLBACK_ROTATE_DEG)
}
