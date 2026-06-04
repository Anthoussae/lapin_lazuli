import type { EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'

export const ANTI_MAGIC_SHELL_ENCHANTMENT_ID = 'ANTI_MAGIC_SHELL' as const

function sameEnchantmentTarget(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

/** Removes one Anti-Magic Shell stack on `target`, if any. */
export function consumeOneAntiMagicShellInstance(
  state: GameState,
  target: EnchantmentTargetRef,
): { state: GameState; consumed: boolean } {
  const combat = state.combat
  if (!combat) return { state, consumed: false }

  const idx = combat.enchantments.findIndex(
    (e) => e.templateId === ANTI_MAGIC_SHELL_ENCHANTMENT_ID && sameEnchantmentTarget(e.target, target),
  )
  if (idx < 0) return { state, consumed: false }

  const enchantments = combat.enchantments.filter((_, i) => i !== idx)
  return {
    state: { ...state, combat: { ...combat, enchantments } },
    consumed: true,
  }
}

