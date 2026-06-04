import { readRootDurationMs } from './relicTooltipPosition'

/** Flamewreath stack fade-out on placeholder (see tokens.css --duration-enchantment-fire-crown-pop-fade). */
export const FIRE_CROWN_POP_FX_TOKEN = {
  duration: '--duration-enchantment-fire-crown-pop-fade',
} as const

export function fireCrownPopFxDurationMs(): number {
  return readRootDurationMs(FIRE_CROWN_POP_FX_TOKEN.duration) || 600
}
