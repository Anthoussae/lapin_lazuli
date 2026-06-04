import { readRootDurationMs } from './relicTooltipPosition'

/** Poison sprite pulse when turn-start HP loss applies (see tokens.css --enchantment-poison-trigger-*). */
export const POISON_ENCHANTMENT_TRIGGER_FX_TOKEN = {
  darkenDuration: '--duration-enchantment-poison-trigger-darken',
  restoreDuration: '--duration-enchantment-poison-trigger-restore',
} as const

export function poisonEnchantmentTriggerDarkenMs(): number {
  return readRootDurationMs(POISON_ENCHANTMENT_TRIGGER_FX_TOKEN.darkenDuration) || 300
}

export function poisonEnchantmentTriggerRestoreMs(): number {
  return readRootDurationMs(POISON_ENCHANTMENT_TRIGGER_FX_TOKEN.restoreDuration) || 300
}

export function poisonEnchantmentTriggerFxTotalMs(): number {
  return poisonEnchantmentTriggerDarkenMs() + poisonEnchantmentTriggerRestoreMs()
}
