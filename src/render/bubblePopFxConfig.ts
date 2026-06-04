import { readRootDurationMs, readRootPxVar } from './relicTooltipPosition'

/** Bubble pop FX at combat stage layer (see tokens.css --enchantment-bubble-pop-*). */
export const BUBBLE_POP_FX_TOKEN = {
  offsetX: '--enchantment-bubble-pop-offset-x',
  offsetY: '--enchantment-bubble-pop-offset-y',
  duration: '--duration-enchantment-bubble-pop-fade',
} as const

export function bubblePopFxOffsetX(): number {
  return readRootPxVar(BUBBLE_POP_FX_TOKEN.offsetX)
}

export function bubblePopFxOffsetY(): number {
  return readRootPxVar(BUBBLE_POP_FX_TOKEN.offsetY)
}

export function bubblePopFxDurationMs(): number {
  return readRootDurationMs(BUBBLE_POP_FX_TOKEN.duration) || 500
}
