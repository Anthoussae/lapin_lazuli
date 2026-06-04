import type { IncomingDamageType, EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { Enchantments } from '../../data/enchantments'

function sameEnchantmentTarget(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

/** Product of `(1 - percent/100)` for each matching static resist stack on `target`. */
export function incomingDamageMultiplierAfterResists(
  state: GameState,
  target: EnchantmentTargetRef,
  damageType: IncomingDamageType,
): number {
  const combat = state.combat
  if (!combat) return 1

  let multiplier = 1
  for (const inst of combat.enchantments) {
    if (!sameEnchantmentTarget(inst.target, target)) continue
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'REDUCE_INCOMING_DAMAGE') continue
      if (fx.damageType !== damageType) continue
      const percent = inst.amountOverride ?? fx.percent
      if (percent <= 0) continue
      multiplier *= (100 - percent) / 100
    }
  }
  return multiplier
}

/** Final damage after multiplicative resists; always rounded up. */
export function applyIncomingDamageReduction(
  state: GameState,
  target: EnchantmentTargetRef,
  damageType: IncomingDamageType,
  damage: number,
): number {
  if (damage <= 0) return 0
  const multiplier = incomingDamageMultiplierAfterResists(state, target, damageType)
  return Math.ceil(damage * multiplier)
}
