import { readRootDurationMs, readRootPxVar } from './relicTooltipPosition'

/** Player unblocked damage hit FX (see tokens.css --player-hit-fx-*). */
export const PLAYER_HIT_FX_TOKEN = {
  shakeDuration: '--duration-player-hit-fx-shake',
  glowDuration: '--duration-player-hit-fx-glow',
  ease: '--ease-player-hit-fx',
  shakeX: '--player-hit-fx-shake-x',
  shakeY: '--player-hit-fx-shake-y',
} as const

export function playerHitFxShakeDurationMs(): number {
  return readRootDurationMs(PLAYER_HIT_FX_TOKEN.shakeDuration) || 280
}

export function playerHitFxGlowDurationMs(): number {
  return readRootDurationMs(PLAYER_HIT_FX_TOKEN.glowDuration) || 400
}

export function playerHitFxShakeXPx(): number {
  return readRootPxVar(PLAYER_HIT_FX_TOKEN.shakeX) || 4
}

export function playerHitFxShakeYPx(): number {
  return readRootPxVar(PLAYER_HIT_FX_TOKEN.shakeY) || 3
}

export function playerHitFxTotalMs(): number {
  return Math.max(playerHitFxShakeDurationMs(), playerHitFxGlowDurationMs()) + 40
}
