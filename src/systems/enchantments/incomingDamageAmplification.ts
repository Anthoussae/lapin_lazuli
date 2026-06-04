import type { EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { Enchantments } from '../../data/enchantments'

function sameEnchantmentTarget(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

/** Sum of amplify percents from each stack on `target` (additive). */
export function incomingDamageAmplifyPercentTotal(state: GameState, target: EnchantmentTargetRef): number {
  const combat = state.combat
  if (!combat) return 0

  let total = 0
  for (const inst of combat.enchantments) {
    if (!sameEnchantmentTarget(inst.target, target)) continue
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS') continue
      const percent = inst.amountOverride ?? fx.percent
      if (percent > 0) total += percent
    }
  }
  return total
}

/** Incoming damage or HP loss after amplify; always rounded up. */
export function applyIncomingDamageAmplification(
  state: GameState,
  target: EnchantmentTargetRef,
  amount: number,
): number {
  if (amount <= 0) return 0
  const percent = incomingDamageAmplifyPercentTotal(state, target)
  if (percent <= 0) return amount
  return Math.ceil(amount * (1 + percent / 100))
}
