import { readRootDurationMs } from './relicTooltipPosition'

/** Poison card HP_LOSS hit burst on combat target (see tokens.css --poison-card-hit-*). */
export const POISON_CARD_HIT_FX_TOKEN = {
  darkenDuration: '--duration-poison-card-hit-darken',
  restoreDuration: '--duration-poison-card-hit-restore',
  fadeDuration: '--duration-poison-card-hit-fade',
} as const

export function poisonCardHitFxDarkenMs(): number {
  return readRootDurationMs(POISON_CARD_HIT_FX_TOKEN.darkenDuration) || 300
}

export function poisonCardHitFxRestoreMs(): number {
  return readRootDurationMs(POISON_CARD_HIT_FX_TOKEN.restoreDuration) || 300
}

export function poisonCardHitFxFadeMs(): number {
  return readRootDurationMs(POISON_CARD_HIT_FX_TOKEN.fadeDuration) || 300
}

export function poisonCardHitFxTotalMs(): number {
  return poisonCardHitFxDarkenMs() + poisonCardHitFxRestoreMs() + poisonCardHitFxFadeMs()
}
