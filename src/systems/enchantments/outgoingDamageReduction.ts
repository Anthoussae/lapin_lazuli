import type { EnchantmentOwner, EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { Enchantments } from '../../data/enchantments'
import type { TakingDamageSource } from './takingDamage'

function sameEnchantmentTarget(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') {
    return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  }
  return true
}

export function damageSourceToEnchantmentTarget(source: TakingDamageSource): EnchantmentTargetRef {
  return source.kind === 'PLAYER'
    ? { kind: 'PLAYER' }
    : { kind: 'ENEMY', enemyInstanceId: source.enemyInstanceId }
}

export function enchantmentOwnerAsDamageSource(owner: EnchantmentOwner): TakingDamageSource {
  return owner.kind === 'PLAYER'
    ? { kind: 'PLAYER' }
    : { kind: 'ENEMY', enemyInstanceId: owner.enemyInstanceId }
}

/** Weaken percent on the damage/HP-loss source (non-stackable; at most one instance applies). */
export function outgoingDamageWeakenPercentTotal(state: GameState, source: TakingDamageSource): number {
  const combat = state.combat
  if (!combat) return 0

  const sourceTarget = damageSourceToEnchantmentTarget(source)
  let total = 0
  for (const inst of combat.enchantments) {
    if (!sameEnchantmentTarget(inst.target, sourceTarget)) continue
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'STATIC') continue
    for (const fx of tmpl.ability.effects) {
      if (fx.kind !== 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS') continue
      const percent = inst.amountOverride ?? fx.percent
      if (percent > 0) total += percent
    }
  }
  return total
}

/** Outgoing damage or HP loss after Weaken; always rounded up. */
export function applyOutgoingDamageAndHpLossModifiers(
  state: GameState,
  source: TakingDamageSource,
  amount: number,
): number {
  if (amount <= 0) return 0
  const percent = outgoingDamageWeakenPercentTotal(state, source)
  if (percent <= 0) return amount
  return Math.ceil(amount * (1 - percent / 100))
}
