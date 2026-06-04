import { readRootDurationMs, readRootPxVar } from './relicTooltipPosition'

/** Anti-Magic Shell pop FX at combat stage layer (see tokens.css --enchantment-anti-magic-shell-pop-*). */
export const ANTI_MAGIC_SHELL_POP_FX_TOKEN = {
  offsetX: '--enchantment-anti-magic-shell-pop-offset-x',
  offsetY: '--enchantment-anti-magic-shell-pop-offset-y',
  duration: '--duration-enchantment-anti-magic-shell-pop-fade',
} as const

export function antiMagicShellPopFxOffsetX(): number {
  return readRootPxVar(ANTI_MAGIC_SHELL_POP_FX_TOKEN.offsetX)
}

export function antiMagicShellPopFxOffsetY(): number {
  return readRootPxVar(ANTI_MAGIC_SHELL_POP_FX_TOKEN.offsetY)
}

export function antiMagicShellPopFxDurationMs(): number {
  return readRootDurationMs(ANTI_MAGIC_SHELL_POP_FX_TOKEN.duration) || 500
}

