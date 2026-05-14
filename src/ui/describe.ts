import type { CardTemplate } from '../data/cards'
import { cardTemplateHasNullInkCost } from '../systems/cards/inkCost'
import type { Effect } from '../data/effects'
import { Gems } from '../data/gems'
import type { RelicTemplate, TriggerDef } from '../data/relics'
import type { GemId } from '../core/types/ids'
import type { CardInstance } from '../core/types/state'
import { cardBaseEffects } from '../systems/cards/cardEffects'
import { boostFireDealDamage, cardHasFireDamageTags } from '../systems/cards/firepower'
import { displayUpgradeTierCount, offeredUpgradeTiersToEffectScaling, scaleCardEffects } from '../systems/cards/upgrades'

function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many
}

/** Exported for UI that builds effect lines outside plain strings (e.g. colored amounts). */
export function englishPlural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many
}

/** Half-step multipliers (1.5, 2, 2.5, …) for display. */
export function formatBunnyMultiplier(amount: number): string {
  const x = Math.round(amount * 2) / 2
  if (Number.isInteger(x)) return String(x)
  return `${Math.floor(x)}.5`
}

export function describeEffect(fx: Effect): string {
  switch (fx.kind) {
    case 'DRAW_CARDS':
      return `draw ${fx.amount} ${plural(fx.amount, 'card')}`
    case 'ADD_BUNNIES':
      return `add ${fx.amount} ${plural(fx.amount, 'bunny', 'bunnies')}`
    case 'MULTIPLY_BUNNIES':
      return `multiply your bunnies by ${formatBunnyMultiplier(fx.amount)}`
    case 'HEAL':
      return `heal ${fx.amount} ${plural(fx.amount, 'hp')}`
    case 'GAIN_SHIELD': {
      const t = fx.target ?? 'player'
      if (t === 'selectedEnemy') return `give the targeted enemy ${fx.amount} ${plural(fx.amount, 'shield')}`
      return `gain ${fx.amount} ${plural(fx.amount, 'shield')}`
    }
    case 'GAIN_LOCKED_SHIELD':
      return `gain ${fx.amount} locked ${plural(fx.amount, 'shield')}`
    case 'LOCK_ALL_SHIELD':
      return 'lock all your shield'
    case 'DESTINY':
      return 'destiny'
    case 'CONSUME':
      return 'consume'
    case 'EXHAUST':
      return 'exhaust'
    case 'UPGRADE_AFTER_CASTING':
      return 'upgrades after casting'
    case 'CONSUME_IF_IN_HAND_AT_TURN_END':
      return 'at end of turn, if this is still in your hand, consume it'
    case 'DEAL_DAMAGE':
      return `deal ${fx.amount} damage`
    case 'GAIN_MAX_HP':
      return `gain ${fx.amount} max hp`
    case 'GAIN_GOLD':
      return `gain ${fx.amount} gold`
    case 'GAIN_KEYS':
      return `gain ${fx.amount} ${plural(fx.amount, 'key')}`
    case 'GAIN_POWER':
      return `gain ${fx.amount} ${plural(fx.amount, 'power')}`
    case 'GAIN_FIREPOWER_MULTIPLIER':
      return `gain ${fx.amount} firepower`
    case 'GAIN_LUCK':
      return `gain ${fx.amount} luck`
    case 'GAIN_INK':
      return `gain ${fx.amount} ink`
    case 'GAIN_MAX_INK':
      return `gain ${fx.amount} max ink`
    case 'UPGRADE_SELECTED_CARD':
      return `upgrade ${fx.numberOfTargets} ${plural(fx.numberOfTargets, 'card')} in your hand`
    case 'CONSUME_SELECTED_CARD':
      return fx.numberOfTargets === 1 ? 'consume a selected card' : `consume up to ${fx.numberOfTargets} selected cards`
    case 'UPGRADE_SPECIFIC_CARD': {
      // Use template id; display formatting can be improved later.
      const pretty = fx.target === 'MULTIBUNNIES' ? 'Multibunnies' : fx.target
      if (fx.numberOfTargets === 1) return `upgrade your ${pretty}`
      return `upgrade ${fx.numberOfTargets} of your ${pretty}`
    }
  }
}

function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text
}

const RELIC_TRIGGER_LINE: Partial<Record<TriggerDef['on'], (eff: string) => string>> = {
  onPickup: (eff) => capitalizeFirst(eff),
  combat_start: (eff) => `At combat start, ${eff}.`,
  turn_start: (eff) => `At turn start, ${eff}.`,
  draw_starting_hand: (eff) => `When drawing your starting hand, ${eff}.`,
  onRest: (eff) => `When you rest, ${eff}.`,
}

export function describeRelicTrigger(trig: TriggerDef): string {
  const eff = describeEffect(trig.effect)
  return RELIC_TRIGGER_LINE[trig.on]?.(eff) ?? eff
}

export function describeRelic(relic: RelicTemplate): string {
  if (relic.text) return relic.text
  if (!relic.triggers.length) return relic.name
  return relic.triggers.map((t) => describeRelicTrigger(t)).join('\n')
}

function unplayableDescriptionLine(card: CardTemplate): string | null {
  return cardTemplateHasNullInkCost(card) ? 'Unplayable.' : null
}

function cardShowsExhaust(card: CardTemplate, socketedGemId: GemId | null = null): boolean {
  if (card.exhaust) return true
  return cardBaseEffects(card.id, socketedGemId).some((fx) => fx.kind === 'EXHAUST')
}

function describeEffectsOrConsumeFallback(
  card: CardTemplate,
  scaled: ReadonlyArray<Effect>,
  socketedGemId: GemId | null = null,
): string {
  const lines: string[] = []
  const unplayable = unplayableDescriptionLine(card)
  if (unplayable) lines.push(unplayable)
  const visibleFx = scaled.filter((fx) => fx.kind !== 'EXHAUST')
  if (visibleFx.length) lines.push(...visibleFx.map((fx) => `${describeEffect(fx)}.`))
  else if (card.tags.includes('consume')) lines.push('Consume.')
  if (cardShowsExhaust(card, socketedGemId)) lines.push('Exhaust.')
  return lines.join('\n')
}

export function describeCard(card: CardTemplate): string {
  return describeEffectsOrConsumeFallback(card, card.effects)
}

export function formatCardName(name: string, upgrades: number): string {
  if (upgrades <= 0) return name
  return `${name} + ${upgrades}`
}

/** Card name from instance effect-scaling upgrades (multiplier shown as base tier count). */
export function formatCardDisplayName(
  card: CardTemplate,
  effectScalingUpgrades: number,
  socketedGemId: GemId | null = null,
): string {
  const base = formatCardName(card.name, displayUpgradeTierCount(card.id, effectScalingUpgrades))
  if (!socketedGemId) return base
  const gem = Gems[socketedGemId]
  if (!gem) return base
  return `${gem.name} ${base}`
}

export function formatCardInstanceDisplayName(card: CardTemplate, inst: CardInstance): string {
  return formatCardDisplayName(card, inst.upgrades, inst.socketedGemId ?? null)
}

/** `upgrades` is the instance counter used by {@link scaleCardEffects} (after upgradeMultiplier). */
export function describeCardWithUpgrades(
  card: CardTemplate,
  upgrades: number,
  socketedGemId: GemId | null = null,
): string {
  const scaled: ReadonlyArray<Effect> = scaleCardEffects(cardBaseEffects(card.id, socketedGemId), upgrades)
  return describeEffectsOrConsumeFallback(card, scaled, socketedGemId)
}

export function describeCardInstance(card: CardTemplate, inst: CardInstance): string {
  return describeCardWithUpgrades(card, inst.upgrades, inst.socketedGemId ?? null)
}

/** Shop/reward rows: `upgradeApplications` is pre-acquisition tier count (multiplier applied here). */
export function describeOfferedCardWithUpgrades(card: CardTemplate, upgradeApplications: number): string {
  const scaling = offeredUpgradeTiersToEffectScaling(card.id, upgradeApplications)
  return describeCardWithUpgrades(card, scaling)
}

export type CombatHandDescLine =
  | { kind: 'plain'; text: string }
  | { kind: 'addBunnies'; baseAmount: number; displayAmount: number }

/**
 * Combat hand only: lines for card text. ADD_BUNNIES rows carry base (scaled, no power) vs display (with power bonus when power > 0).
 * Other zones should use {@link describeCardWithUpgrades}.
 */
export function combatHandDescriptionLines(
  card: CardTemplate,
  upgrades: number,
  power: number,
  socketedGemId: GemId | null = null,
  firepowerMultiplier = 0,
): CombatHandDescLine[] {
  const baseEffects = cardBaseEffects(card.id, socketedGemId)
  const lines: CombatHandDescLine[] = []
  const unplayable = unplayableDescriptionLine(card)
  if (unplayable) lines.push({ kind: 'plain', text: unplayable })
  if (!baseEffects.length) {
    if (!lines.length && card.tags.includes('consume')) return [{ kind: 'plain', text: 'Consume.' }]
    return lines
  }
  if (cardShowsExhaust(card, socketedGemId)) lines.push({ kind: 'plain', text: 'Exhaust.' })
  const scaled = scaleCardEffects(baseEffects, upgrades)
    .filter((fx) => fx.kind !== 'EXHAUST')
    .map((fx): CombatHandDescLine => {
    if (fx.kind === 'ADD_BUNNIES') {
      const baseAmount = fx.amount
      const displayAmount = power > 0 ? fx.amount + power : fx.amount
      return { kind: 'addBunnies', baseAmount, displayAmount }
    }
    if (fx.kind === 'DEAL_DAMAGE' && cardHasFireDamageTags(card.tags)) {
      const displayAmount = boostFireDealDamage(fx.amount, firepowerMultiplier)
      return { kind: 'plain', text: `deal ${displayAmount} damage.` }
    }
    return { kind: 'plain', text: `${describeEffect(fx)}.` }
  })
  return [...lines, ...scaled]
}

export function combatHandDescriptionLinesForInstance(
  card: CardTemplate,
  inst: CardInstance,
  power: number,
  firepowerMultiplier = 0,
): CombatHandDescLine[] {
  return combatHandDescriptionLines(card, inst.upgrades, power, inst.socketedGemId ?? null, firepowerMultiplier)
}

