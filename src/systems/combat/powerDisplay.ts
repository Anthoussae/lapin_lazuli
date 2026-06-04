import type { EnemyInstanceId, RelicId } from '../../core/types/ids'
import type { EnchantmentInstance } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { boostFireDealDamage } from '../cards/firepower'
import { resolveShieldGainAmount } from '../cards/shieldPower'
import { effectiveFirepower, effectivePower, effectiveShieldPower } from './combatBonuses'
import { applyIncomingDamageAmplification } from '../enchantments/incomingDamageAmplification'
import { applyOutgoingDamageAndHpLossModifiers } from '../enchantments/outgoingDamageReduction'
import { shieldPowerPenaltyFromEnchantments } from '../enchantments/staticEffects'
import { outgoingDamageWeakenPercentTotal } from '../enchantments/outgoingDamageReduction'

/** Current player power totals used to preview card/enchantment amounts (matches combat resolution). */
export type PowerDisplayContext = Readonly<{
  bunnyPower: number
  firepower: number
  firepowerMultiplier: number
  shieldPower: number
  shieldPowerPenalty: number
  outgoingDamageWeakenPercent: number
  hasGreenHat: boolean
}>

export const EMPTY_POWER_DISPLAY: PowerDisplayContext = Object.freeze({
  bunnyPower: 0,
  firepower: 0,
  firepowerMultiplier: 0,
  shieldPower: 0,
  shieldPowerPenalty: 0,
  outgoingDamageWeakenPercent: 0,
  hasGreenHat: false,
})

export function playerHasGreenHat(relics: ReadonlyArray<{ templateId: RelicId }>): boolean {
  return relics.some((r) => r.templateId === 'GREEN_HAT')
}

export function powerDisplayContextFromState(state: GameState): PowerDisplayContext {
  return {
    bunnyPower: effectivePower(state),
    firepower: effectiveFirepower(state),
    firepowerMultiplier: state.player.firepowerMultiplier,
    shieldPower: effectiveShieldPower(state),
    shieldPowerPenalty: shieldPowerPenaltyFromEnchantments(state, { kind: 'PLAYER' }),
    outgoingDamageWeakenPercent: outgoingDamageWeakenPercentTotal(state, { kind: 'PLAYER' }),
    hasGreenHat: playerHasGreenHat(state.player.relics),
  }
}

/** Out-of-combat previews (deck inspect, shop, rewards) — permanent stats only. */
export function powerDisplayContextFromPlayer(
  player: Pick<GameState['player'], 'power' | 'firepower' | 'firepowerMultiplier' | 'shieldPower' | 'relics'>,
): PowerDisplayContext {
  return {
    bunnyPower: player.power,
    firepower: player.firepower,
    firepowerMultiplier: player.firepowerMultiplier,
    shieldPower: player.shieldPower,
    shieldPowerPenalty: 0,
    outgoingDamageWeakenPercent: 0,
    hasGreenHat: playerHasGreenHat(player.relics),
  }
}

export function greenHatPoisonBoostCeil(n: number): number {
  return Math.ceil(n * 1.5)
}

/** Poison HP loss on a card (Smog, etc.). */
export function displayCardPoisonHpLoss(
  base: number,
  ctx: PowerDisplayContext,
  target: 'player' | 'selectedEnemy',
): number {
  if (!ctx.hasGreenHat) return base
  if (target === 'player') return base
  return greenHatPoisonBoostCeil(base)
}

/** Poison HP loss from an enchantment instance. */
export function displayEnchantmentPoisonHpLoss(
  base: number,
  ctx: PowerDisplayContext,
  inst: Pick<EnchantmentInstance, 'owner' | 'target'>,
): number {
  if (!ctx.hasGreenHat) return base
  if (inst.owner.kind === 'PLAYER') return greenHatPoisonBoostCeil(base)
  return base
}

/** Gameplay: same rules as {@link displayEnchantmentPoisonHpLoss}. */
export function resolveEnchantmentPoisonHpLoss(
  base: number,
  state: GameState,
  inst: Pick<EnchantmentInstance, 'owner' | 'target'>,
  poisonTagged: boolean,
): number {
  if (!poisonTagged || base <= 0) return base
  return displayEnchantmentPoisonHpLoss(base, powerDisplayContextFromState(state), inst)
}

export function displayFireDamage(base: number, ctx: PowerDisplayContext): number {
  return boostFireDealDamage(base, ctx.firepower, ctx.firepowerMultiplier)
}

export function displayOutgoingPlayerDamage(base: number, ctx: PowerDisplayContext): number {
  if (base <= 0 || ctx.outgoingDamageWeakenPercent <= 0) return base
  return Math.ceil(base * (1 - ctx.outgoingDamageWeakenPercent / 100))
}

/** Enemy attack damage dealt to the player (Weaken on enemy, Amplify on player). */
export function displayIncomingEnemyAttackDamage(
  state: GameState,
  enemyInstanceId: EnemyInstanceId,
  baseDamage: number,
): number {
  if (baseDamage <= 0) return 0
  const afterOutgoing = applyOutgoingDamageAndHpLossModifiers(
    state,
    { kind: 'ENEMY', enemyInstanceId },
    baseDamage,
  )
  return applyIncomingDamageAmplification(state, { kind: 'PLAYER' }, afterOutgoing)
}

/** Player card poison HP loss after green-hat boost and Weaken. */
export function displayPlayerPoisonHpLoss(
  base: number,
  ctx: PowerDisplayContext,
  target: 'player' | 'selectedEnemy',
): number {
  return displayOutgoingPlayerDamage(displayCardPoisonHpLoss(base, ctx, target), ctx)
}

export function displayShieldGain(base: number, ctx: PowerDisplayContext, appliesShieldPower: boolean): number {
  return resolveShieldGainAmount(base, ctx.shieldPower, ctx.shieldPowerPenalty, appliesShieldPower)
}

export function displayAddBunnies(base: number, ctx: PowerDisplayContext): number {
  return ctx.bunnyPower > 0 ? base + ctx.bunnyPower : base
}
