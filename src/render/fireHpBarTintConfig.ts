import { readRootDurationMs } from './relicTooltipPosition'

/** HP bar fill tint during fire HP loss (see tokens.css --duration-fire-hp-bar-tint). */
export const FIRE_HP_BAR_TINT_TOKEN = {
  duration: '--duration-fire-hp-bar-tint',
} as const

export function fireHpBarTintDurationMs(): number {
  return readRootDurationMs(FIRE_HP_BAR_TINT_TOKEN.duration) || 800
}
