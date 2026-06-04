import { readRootDurationMs } from './relicTooltipPosition'

/** Poison stack fade-out on placeholder (see tokens.css --duration-enchantment-poison-pop-fade). */
export const POISON_POP_FX_TOKEN = {
  duration: '--duration-enchantment-poison-pop-fade',
} as const

export function poisonPopFxDurationMs(): number {
  return readRootDurationMs(POISON_POP_FX_TOKEN.duration) || 600
}
