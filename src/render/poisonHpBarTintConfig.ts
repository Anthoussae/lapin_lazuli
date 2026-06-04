import { readRootDurationMs } from './relicTooltipPosition'

/** HP bar fill tint during poison HP loss tick (see tokens.css --duration-poison-hp-bar-tint). */
export const POISON_HP_BAR_TINT_TOKEN = {
  duration: '--duration-poison-hp-bar-tint',
} as const

export function poisonHpBarTintDurationMs(): number {
  return readRootDurationMs(POISON_HP_BAR_TINT_TOKEN.duration) || 400
}
