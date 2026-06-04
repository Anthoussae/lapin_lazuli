import type { EnchantmentTargetRef } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { applyPlayerDamageThroughShields } from '../combat/shieldDamage'

export const BUBBLE_ENCHANTMENT_ID = 'BUBBLE' as const

function sameEnchantmentTarget(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

/** Removes one Bubble stack on `target`, if any. */
export function consumeOneBubbleInstance(
  state: GameState,
  target: EnchantmentTargetRef,
): { state: GameState; consumed: boolean } {
  const combat = state.combat
  if (!combat) return { state, consumed: false }

  const idx = combat.enchantments.findIndex((e) => e.templateId === BUBBLE_ENCHANTMENT_ID && sameEnchantmentTarget(e.target, target))
  if (idx < 0) return { state, consumed: false }

  const enchantments = combat.enchantments.filter((_, i) => i !== idx)
  return {
    state: { ...state, combat: { ...combat, enchantments } },
    consumed: true,
  }
}

/**
 * Shield/locked-shield absorption always applies. Bubble prevents HP loss from the unblocked portion.
 * When prevented, {@link unshieldedDamage} is reported as 0 (no unblocked hit for relics/vampiric).
 */
export function applyPlayerDamageThroughShieldsMaybeBubble(
  state: GameState,
  target: EnchantmentTargetRef,
  shield: number,
  lockedShield: number,
  hp: number,
  damage: number,
): {
  state: GameState
  shield: number
  lockedShield: number
  hp: number
  unshieldedDamage: number
} {
  const hit = applyPlayerDamageThroughShields(shield, lockedShield, hp, damage)
  if (hit.unshieldedDamage <= 0) {
    return { state, shield: hit.shield, lockedShield: hit.lockedShield, hp: hit.hp, unshieldedDamage: 0 }
  }

  const bubble = consumeOneBubbleInstance(state, target)
  if (bubble.consumed) {
    return {
      state: bubble.state,
      shield: hit.shield,
      lockedShield: hit.lockedShield,
      hp,
      unshieldedDamage: 0,
    }
  }

  return {
    state,
    shield: hit.shield,
    lockedShield: hit.lockedShield,
    hp: hit.hp,
    unshieldedDamage: hit.unshieldedDamage,
  }
}

/** Direct HP loss (ignores shield). One Bubble stack prevents the entire instance. */
export function applyHpLossMaybeBubble(
  state: GameState,
  target: EnchantmentTargetRef,
  currentHp: number,
  amount: number,
): { state: GameState; nextHp: number; lossApplied: boolean } {
  if (amount <= 0) return { state, nextHp: currentHp, lossApplied: false }

  const bubble = consumeOneBubbleInstance(state, target)
  if (bubble.consumed) {
    return { state: bubble.state, nextHp: currentHp, lossApplied: false }
  }

  return { state, nextHp: Math.max(0, currentHp - amount), lossApplied: true }
}
