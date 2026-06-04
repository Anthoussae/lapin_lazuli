import type { IncomingDamageType, EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { applyIncomingDamageAmplification } from './incomingDamageAmplification'
import { applyIncomingDamageReduction } from './incomingDamageReduction'

/** Amplify (additive stacks), then typed incoming-damage resists when `damageType` is set. */
export function applyIncomingDamageAndHpLossModifiers(
  state: GameState,
  target: EnchantmentTargetRef,
  amount: number,
  opts?: Readonly<{ damageType?: IncomingDamageType }>,
): number {
  if (amount <= 0) return 0
  let amt = applyIncomingDamageAmplification(state, target, amount)
  if (opts?.damageType) {
    amt = applyIncomingDamageReduction(state, target, opts.damageType, amt)
  }
  return amt
}
