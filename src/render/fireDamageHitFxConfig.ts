import { readRootDurationMs } from './relicTooltipPosition'

/** Fire damage hit burst on combat target (see tokens.css --fire-damage-hit-*). */
export const FIRE_DAMAGE_HIT_FX_TOKEN = {
  intensifyDuration: '--duration-fire-damage-hit-intensify',
  fadeDuration: '--duration-fire-damage-hit-fade',
} as const

export function fireDamageHitFxIntensifyMs(): number {
  return readRootDurationMs(FIRE_DAMAGE_HIT_FX_TOKEN.intensifyDuration) || 400
}

export function fireDamageHitFxFadeMs(): number {
  return readRootDurationMs(FIRE_DAMAGE_HIT_FX_TOKEN.fadeDuration) || 400
}

export function fireDamageHitFxTotalMs(): number {
  return fireDamageHitFxIntensifyMs() + fireDamageHitFxFadeMs()
}
