import type { CardTemplate } from '../data/cards'
import { cardTemplateHasNullInkCost } from '../systems/cards/inkCost'
import type { Effect } from '../data/effects'
import { Gems, type GemTemplate } from '../data/gems'
import type { RelicTemplate, TriggerDef } from '../data/relics'
import type { GemId } from '../core/types/ids'
import type { CardInstance } from '../core/types/state'
import { cardBaseEffects } from '../systems/cards/cardEffects'
import { boostFireDealDamage, cardHasFireDamageTags } from '../systems/cards/firepower'
import { boostShieldGain, cardHasAddShieldTag } from '../systems/cards/shieldPower'
import { applyCardInstanceEffectModifiers } from '../systems/cards/upgrades'
import {
  cardKeywordIds,
  CARD_KEYWORDS,
  gemKeywordIds,
  type CardKeywordId,
  isKeywordEffectKind,
} from './cardKeywords'

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

function greenHatPoisonResistCeil(n: number): number {
  return Math.ceil(n * 0.5)
}

function greenHatPoisonBoostCeil(n: number): number {
  return Math.ceil(n * 1.5)
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
    case 'HP_LOSS': {
      const t = fx.target ?? 'selectedEnemy'
      if (t === 'player') return `lose ${fx.amount} ${plural(fx.amount, 'hp')}`
      return `enemy loses ${fx.amount} ${plural(fx.amount, 'hp')}`
    }
    case 'GAIN_SHIELD': {
      const t = fx.target ?? 'player'
      if (t === 'selectedEnemy') return `give the targeted enemy ${fx.amount} ${plural(fx.amount, 'shield')}`
      return `gain ${fx.amount} ${plural(fx.amount, 'shield')}`
    }
    case 'GAIN_SHIELD_EQUAL_TO_LEVEL':
      return 'gain shields equal to your level'
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
    case 'DEAL_DAMAGE':
      return `deal ${fx.amount} damage`
    case 'GAIN_MAX_HP':
      return `gain ${fx.amount} max hp`
    case 'GAIN_GOLD':
      return `gain ${fx.amount} gold`
    case 'GAIN_INTEREST':
      return `gain ${fx.percentAmount}% gold interest (rounded up)`
    case 'GAIN_KEYS':
      return `gain ${fx.amount} ${plural(fx.amount, 'key')}`
    case 'GAIN_POWER':
      return fx.duration === 'combat'
        ? `gain ${fx.amount} ${plural(fx.amount, 'power')} until end of combat`
        : `gain ${fx.amount} ${plural(fx.amount, 'power')}`
    case 'GAIN_SHIELD_POWER':
      return fx.duration === 'combat'
        ? `gain ${fx.amount} shield power until end of combat`
        : `gain ${fx.amount} shield power`
    case 'GAIN_FIREPOWER':
      return fx.duration === 'combat' ? `gain ${fx.amount} fire power until end of combat` : `gain ${fx.amount} fire power`
    case 'GAIN_FIREPOWER_MULTIPLIER':
      return `gain ${fx.amount} firepower multiplier`
    case 'GAIN_LUCK':
      return `gain ${fx.amount} luck`
    case 'GAIN_INK':
      return `gain ${fx.amount} ink`
    case 'GAIN_MAX_INK':
      return `gain ${fx.amount} max ink`
    case 'GAIN_HAND_SIZE':
      return `gain ${fx.amount} hand size`
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
    case 'UPGRADE_RANDOM_DECK_CARDS':
      return `upgrade ${fx.numberOfTargets} random ${plural(fx.numberOfTargets, 'card')} in your deck`
    case 'ACTIVATE_FREE_FIRST_FIRE_SPELL':
      return 'your first fire spell each combat costs 0 ink'
    case 'NEXT_SPELL_COSTS_0':
      return 'your next spell costs 0 ink'
    case 'GAIN_ALL_POWERS_PER_OWNED_BURDEN':
      return 'gain +1 bunny power, +1 shield power, and +1 fire power for each burden you own until end of combat'
    case 'ADD_RANDOM_POTION_TO_HAND':
      return 'add a random potion to your hand'
    case 'APPLY_ENCHANTMENT': {
      const amt = fx.amount ?? 0
      if (fx.enchantmentId === 'STONESKIN') return `Enchantment. Gain +${amt} shield power`
      if (fx.enchantmentId === 'HARE_RAISING') return `Enchantment. Gain +${amt} bunny power`
      if (fx.enchantmentId === 'WARM') return `Enchantment. Gain +${amt} fire power`
      if (fx.enchantmentId === 'POISON') return `enemy loses ${amt} hp each turn`
      if (fx.enchantmentId === 'FLAMEWREATH') return `deal ${amt} damage when attacked`
      return `apply ${fx.enchantmentId}`
    }
    case 'DISPEL':
      return `dispel ${fx.amount}`
  }
}

function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text
}

/** First word of card description text is always capitalized. */
export function capitalizeCardDescriptionText(text: string): string {
  return capitalizeFirst(text)
}

function plainCardDescLine(text: string): { kind: 'plain'; text: string } {
  return { kind: 'plain', text: capitalizeCardDescriptionText(text) }
}

const RELIC_TRIGGER_LINE: Partial<Record<TriggerDef['on'], (eff: string) => string>> = {
  onPickup: (eff) => capitalizeFirst(eff),
  combat_start: (eff) => `At combat start, ${eff}.`,
  turn_start: (eff) => `At turn start, ${eff}.`,
  fourthSpellCastPerTurn: (eff) => `After you cast your fourth spell this turn, ${eff}.`,
  draw_starting_hand: (eff) => `When drawing your starting hand, ${eff}.`,
  onNonOpenerCardDraw: (eff) => `Whenever you draw a card other than into your opening hand, ${eff}.`,
  onPlayerUnblockedDamage: (eff) => `The first time you take damage each combat, ${eff}.`,
  onTotalAttackBlock: (eff) => `Whenever you completely block an enemy's attack, ${eff}.`,
  potion_played: (eff) => `Whenever you use a potion, ${eff}.`,
  combat_end: (eff) => `At the end of each combat, ${eff}.`,
  onRest: (eff) => `When you rest, ${eff}.`,
  onSleep: (eff) => `When you sleep, ${eff}.`,
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

/** Effect/description text only (excludes relic name; for tooltips). */
export function describeRelicEffect(relic: RelicTemplate): string {
  if (relic.text) return relic.text
  if (!relic.triggers.length) return ''
  return relic.triggers.map((t) => describeRelicTrigger(t)).join('\n')
}

function unplayableDescriptionLine(card: CardTemplate): string | null {
  return cardTemplateHasNullInkCost(card) ? 'Unplayable.' : null
}

function isDescriptionKeywordEffect(fx: Effect): boolean {
  return isKeywordEffectKind(fx.kind)
}

function formatKeywordLabelsLine(ids: ReadonlyArray<CardKeywordId>): string {
  return `${ids.map((id) => CARD_KEYWORDS[id].label).join(', ')}.`
}

function describeEffectsOrConsumeFallback(
  card: CardTemplate,
  scaled: ReadonlyArray<Effect>,
  socketedGemId: GemId | null = null,
  grantedExpire = false,
): string {
  const lines: string[] = []
  const unplayable = unplayableDescriptionLine(card)
  if (unplayable) lines.push(unplayable)
  const visibleFx = scaled.filter((fx) => !isDescriptionKeywordEffect(fx))
  if (visibleFx.length) lines.push(...visibleFx.map((fx) => capitalizeCardDescriptionText(`${describeEffect(fx)}.`)))
  else if (card.tags.includes('consume')) lines.push('Consume.')
  const keywordIds = cardKeywordIds(card, socketedGemId, grantedExpire)
  if (keywordIds.length) lines.push(capitalizeCardDescriptionText(formatKeywordLabelsLine(keywordIds)))
  return lines.join('\n')
}

export function describeCard(card: CardTemplate): string {
  return describeEffectsOrConsumeFallback(card, card.effects)
}

export function formatCardName(name: string, upgrades: number): string {
  if (upgrades <= 0) return name
  return `${name} + ${upgrades}`
}

/** Card name from instance effect-scaling upgrade counter. */
export function formatCardDisplayName(
  card: CardTemplate,
  effectScalingUpgrades: number,
  socketedGemId: GemId | null = null,
): string {
  const base = formatCardName(card.name, effectScalingUpgrades)
  if (!socketedGemId) return base
  const gem = Gems[socketedGemId]
  if (!gem) return base
  return `${gem.name} ${base}`
}

export function formatCardInstanceDisplayName(card: CardTemplate, inst: CardInstance): string {
  return formatCardDisplayName(card, inst.upgrades, inst.socketedGemId ?? null)
}

/** `upgrades` is the instance counter used by {@link applyCardInstanceEffectModifiers}. */
export function describeCardWithUpgrades(
  card: CardTemplate,
  upgrades: number,
  socketedGemId: GemId | null = null,
  foil = false,
): string {
  const scaled = applyCardInstanceEffectModifiers(cardBaseEffects(card.id, socketedGemId), upgrades, foil)
  return describeEffectsOrConsumeFallback(card, scaled, socketedGemId)
}

export function describeCardInstance(card: CardTemplate, inst: CardInstance): string {
  return describeCardWithUpgrades(card, inst.upgrades, inst.socketedGemId ?? null, inst.foil === true)
}

/** Shop/reward rows: `upgradeApplications` is the pre-acquisition upgrade counter. */
export function describeOfferedCardWithUpgrades(card: CardTemplate, upgradeApplications: number): string {
  return describeCardWithUpgrades(card, upgradeApplications)
}

export type CardDescAmountFormat = 'integer' | 'multiplier'

export type CardDescSegment =
  | { kind: 'text'; text: string }
  | { kind: 'amount'; base: number; display: number; format?: CardDescAmountFormat }

export type CardDescLine =
  | { kind: 'plain'; text: string }
  | { kind: 'segments'; segments: ReadonlyArray<CardDescSegment> }
  | { kind: 'keywords'; ids: ReadonlyArray<CardKeywordId> }

function amtSeg(base: number, display: number, format: CardDescAmountFormat = 'integer'): CardDescSegment {
  return { kind: 'amount', base, display, format }
}

function txt(text: string): CardDescSegment {
  return { kind: 'text', text }
}

const EMBEDDED_ENCHANTMENT_POWER_IDS = new Set(['STONESKIN', 'HARE_RAISING', 'WARM'])

function enchantmentPowerGainSegments(
  enchantmentId: string,
  baseAmt: number,
  displayAmt: number,
): CardDescSegment[] | null {
  const suffix =
    enchantmentId === 'STONESKIN'
      ? ' shield power.'
      : enchantmentId === 'HARE_RAISING'
        ? ' bunny power.'
        : enchantmentId === 'WARM'
          ? ' fire power.'
          : null
  if (!suffix) return null
  return [txt('Enchantment. Gain +'), amtSeg(baseAmt, displayAmt), txt(suffix)]
}

function capitalizeFirstSegment(segments: CardDescSegment[]): CardDescSegment[] {
  if (!segments.length || segments[0].kind !== 'text' || !segments[0].text.length) return segments
  const first = segments[0]
  return [{ kind: 'text', text: capitalizeFirst(first.text) }, ...segments.slice(1)]
}

function effectDescriptionLine(
  card: CardTemplate,
  baseFx: Effect,
  displayFx: Effect,
  power: number,
  firepower: number,
  firepowerMultiplier: number,
  shieldPower: number,
  hasGreenHat: boolean,
): CardDescLine {
  const segments = capitalizeFirstSegment(
    buildEffectSegments(card, baseFx, displayFx, power, firepower, firepowerMultiplier, shieldPower, hasGreenHat),
  )
  return { kind: 'segments', segments }
}

function buildEffectSegments(
  card: CardTemplate,
  baseFx: Effect,
  displayFx: Effect,
  power: number,
  firepower: number,
  firepowerMultiplier: number,
  shieldPower: number,
  hasGreenHat: boolean,
): CardDescSegment[] {
  switch (displayFx.kind) {
    case 'DRAW_CARDS':
      return [
        txt('draw '),
        amtSeg(baseFx.kind === 'DRAW_CARDS' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` ${plural(displayFx.amount, 'card')}.`),
      ]
    case 'ADD_BUNNIES': {
      const base = baseFx.kind === 'ADD_BUNNIES' ? baseFx.amount : displayFx.amount
      const display = power > 0 ? displayFx.amount + power : displayFx.amount
      return [
        txt('add '),
        amtSeg(base, display),
        txt(` ${plural(display, 'bunny', 'bunnies')}.`),
      ]
    }
    case 'MULTIPLY_BUNNIES':
      return [
        txt('multiply your bunnies by '),
        amtSeg(
          baseFx.kind === 'MULTIPLY_BUNNIES' ? baseFx.amount : displayFx.amount,
          displayFx.amount,
          'multiplier',
        ),
        txt('.'),
      ]
    case 'HEAL':
      return [
        txt('heal '),
        amtSeg(baseFx.kind === 'HEAL' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` ${plural(displayFx.amount, 'hp')}.`),
      ]
    case 'HP_LOSS': {
      let base = baseFx.kind === 'HP_LOSS' ? baseFx.amount : displayFx.amount
      const t = displayFx.target ?? 'selectedEnemy'
      let display = displayFx.amount
      if (hasGreenHat && card.tags.includes('poison')) {
        if (t === 'player') {
          base = greenHatPoisonResistCeil(base)
          display = greenHatPoisonResistCeil(display)
        } else {
          base = greenHatPoisonBoostCeil(base)
          display = greenHatPoisonBoostCeil(display)
        }
      }
      if (t === 'player') {
        return [txt('lose '), amtSeg(base, display), txt(` ${plural(display, 'hp')}.`)]
      }
      return [txt('enemy loses '), amtSeg(base, display), txt(` ${plural(display, 'hp')}.`)]
    }
    case 'GAIN_SHIELD': {
      const base = baseFx.kind === 'GAIN_SHIELD' ? baseFx.amount : displayFx.amount
      const t = displayFx.target ?? 'player'
      if (t === 'selectedEnemy') {
        return [
          txt('give the targeted enemy '),
          amtSeg(base, displayFx.amount),
          txt(` ${plural(displayFx.amount, 'shield')}.`),
        ]
      }
      const display =
        cardHasAddShieldTag(card.tags) && shieldPower > 0
          ? boostShieldGain(displayFx.amount, shieldPower)
          : displayFx.amount
      return [
        txt('gain '),
        amtSeg(base, display),
        txt(` ${plural(display, 'shield')}.`),
      ]
    }
    case 'GAIN_LOCKED_SHIELD':
      return [
        txt('gain '),
        amtSeg(
          baseFx.kind === 'GAIN_LOCKED_SHIELD' ? baseFx.amount : displayFx.amount,
          displayFx.amount,
        ),
        txt(` locked ${plural(displayFx.amount, 'shield')}.`),
      ]
    case 'DEAL_DAMAGE': {
      const base = baseFx.kind === 'DEAL_DAMAGE' ? baseFx.amount : displayFx.amount
      const display = cardHasFireDamageTags(card.tags)
        ? boostFireDealDamage(displayFx.amount, firepower, firepowerMultiplier)
        : displayFx.amount
      return [txt('deal '), amtSeg(base, display), txt(' damage.')]
    }
    case 'GAIN_MAX_HP':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_MAX_HP' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` max hp.`),
      ]
    case 'GAIN_GOLD':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_GOLD' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` gold.`),
      ]
    case 'GAIN_KEYS':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_KEYS' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` ${plural(displayFx.amount, 'key')}.`),
      ]
    case 'GAIN_POWER':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_POWER' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` ${plural(displayFx.amount, 'power')}.`),
      ]
    case 'GAIN_FIREPOWER':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_FIREPOWER' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` fire power.`),
      ]
    case 'GAIN_FIREPOWER_MULTIPLIER':
      return [
        txt('gain '),
        amtSeg(
          baseFx.kind === 'GAIN_FIREPOWER_MULTIPLIER' ? baseFx.amount : displayFx.amount,
          displayFx.amount,
        ),
        txt(` firepower multiplier.`),
      ]
    case 'GAIN_LUCK':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_LUCK' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` luck.`),
      ]
    case 'GAIN_INK':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_INK' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` ink.`),
      ]
    case 'GAIN_MAX_INK':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_MAX_INK' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` max ink.`),
      ]
    case 'GAIN_HAND_SIZE':
      return [
        txt('gain '),
        amtSeg(baseFx.kind === 'GAIN_HAND_SIZE' ? baseFx.amount : displayFx.amount, displayFx.amount),
        txt(` hand size.`),
      ]
    case 'UPGRADE_SELECTED_CARD':
      return [
        txt('upgrade '),
        amtSeg(
          baseFx.kind === 'UPGRADE_SELECTED_CARD' ? baseFx.numberOfTargets : displayFx.numberOfTargets,
          displayFx.numberOfTargets,
        ),
        txt(` ${plural(displayFx.numberOfTargets, 'card')} in your hand.`),
      ]
    case 'CONSUME_SELECTED_CARD':
      if (displayFx.numberOfTargets === 1) return [txt('consume a selected card.')]
      return [
        txt('consume up to '),
        amtSeg(
          baseFx.kind === 'CONSUME_SELECTED_CARD' ? baseFx.numberOfTargets : displayFx.numberOfTargets,
          displayFx.numberOfTargets,
        ),
        txt(' selected cards.'),
      ]
    case 'UPGRADE_SPECIFIC_CARD': {
      const pretty = displayFx.target === 'MULTIBUNNIES' ? 'Multibunnies' : displayFx.target
      const baseTargets =
        baseFx.kind === 'UPGRADE_SPECIFIC_CARD' ? baseFx.numberOfTargets : displayFx.numberOfTargets
      if (displayFx.numberOfTargets === 1) return [txt(`upgrade your ${pretty}.`)]
      return [
        txt('upgrade '),
        amtSeg(baseTargets, displayFx.numberOfTargets),
        txt(` of your ${pretty}.`),
      ]
    }
    case 'UPGRADE_RANDOM_DECK_CARDS': {
      const baseTargets =
        baseFx.kind === 'UPGRADE_RANDOM_DECK_CARDS' ? baseFx.numberOfTargets : displayFx.numberOfTargets
      return [
        txt('upgrade '),
        amtSeg(baseTargets, displayFx.numberOfTargets),
        txt(` random ${plural(displayFx.numberOfTargets, 'card')} in your deck.`),
      ]
    }
    case 'APPLY_ENCHANTMENT': {
      const base =
        baseFx.kind === 'APPLY_ENCHANTMENT' ? (baseFx.amount ?? 0) : (displayFx.amount ?? 0)
      const display = displayFx.amount ?? 0
      const powerGain = enchantmentPowerGainSegments(displayFx.enchantmentId, base, display)
      if (powerGain) return powerGain
      if (displayFx.enchantmentId === 'FLAMEWREATH') {
        const boosted = boostFireDealDamage(display, firepower, firepowerMultiplier)
        return [txt('deal '), amtSeg(base, boosted), txt(' damage when attacked.')]
      }
      if (displayFx.enchantmentId === 'POISON') {
        const baseAdj = hasGreenHat ? greenHatPoisonBoostCeil(base) : base
        const displayAdj = hasGreenHat ? greenHatPoisonBoostCeil(display) : display
        return [txt('enemy loses '), amtSeg(baseAdj, displayAdj), txt(` hp each turn.`)]
      }
      return [txt(`${describeEffect(displayFx)}.`)]
    }
    default:
      return [txt(`${describeEffect(displayFx)}.`)]
  }
}

/**
 * Structured card description lines. ADD_BUNNIES / addShield GAIN_SHIELD rows show base vs boosted amounts in green.
 */
export function cardDescriptionLines(
  card: CardTemplate,
  upgrades: number,
  power: number,
  socketedGemId: GemId | null = null,
  firepower = 0,
  firepowerMultiplier = 0,
  shieldPower = 0,
  foil = false,
  grantedExpire = false,
  hasGreenHat = false,
): CardDescLine[] {
  const baseEffects = cardBaseEffects(card.id, socketedGemId)
  const lines: CardDescLine[] = []
  const unplayable = unplayableDescriptionLine(card)
  if (unplayable) lines.push(plainCardDescLine(unplayable))
  if (!baseEffects.length) {
    const keywordIds = cardKeywordIds(card, socketedGemId, grantedExpire)
    const keywordLines: CardDescLine[] = keywordIds.length ? [{ kind: 'keywords', ids: keywordIds }] : []
    if (!lines.length && card.tags.includes('consume')) return [plainCardDescLine('Consume.')]
    return [...lines, ...keywordLines]
  }
  const baseScaled = applyCardInstanceEffectModifiers(baseEffects, 0, foil).filter(
    (fx) => !isDescriptionKeywordEffect(fx),
  )
  const scaled = applyCardInstanceEffectModifiers(baseEffects, upgrades, foil).filter(
    (fx) => !isDescriptionKeywordEffect(fx),
  )
  const effectLines: CardDescLine[] = scaled.map((fx, i) =>
    effectDescriptionLine(
      card,
      baseScaled[i] ?? fx,
      fx,
      power,
      firepower,
      firepowerMultiplier,
      shieldPower,
      hasGreenHat,
    ),
  )
  const embedsEnchantmentInEffect = scaled.some(
    (fx) => fx.kind === 'APPLY_ENCHANTMENT' && EMBEDDED_ENCHANTMENT_POWER_IDS.has(fx.enchantmentId),
  )
  const keywordIds = cardKeywordIds(card, socketedGemId, grantedExpire).filter(
    (id) => !(id === 'enchantment' && embedsEnchantmentInEffect),
  )
  const keywordLines: CardDescLine[] = keywordIds.length ? [{ kind: 'keywords', ids: keywordIds }] : []
  return [...lines, ...effectLines, ...keywordLines]
}

export function describeGemEffect(gem: GemTemplate): string {
  return gemOfferDescriptionLines(gem)
    .map((line) => {
      if (line.kind === 'plain') return line.text
      if (line.kind === 'keywords') {
        return capitalizeCardDescriptionText(
          `${line.ids.map((id) => CARD_KEYWORDS[id].label).join(', ')}.`,
        )
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

export function gemOfferDescriptionLines(gem: GemTemplate): CardDescLine[] {
  const lines: CardDescLine[] = gem.effects
    .filter((fx) => !isKeywordEffectKind(fx.kind))
    .map((fx) => plainCardDescLine(`${describeEffect(fx)}.`))
  const keywordIds = gemKeywordIds(gem)
  if (keywordIds.length) lines.push({ kind: 'keywords', ids: keywordIds })
  return lines
}

export function cardDescriptionLinesForInstance(
  card: CardTemplate,
  inst: CardInstance,
  power: number,
  firepower = 0,
  firepowerMultiplier = 0,
  shieldPower = 0,
  hasGreenHat = false,
): CardDescLine[] {
  return cardDescriptionLines(
    card,
    inst.upgrades,
    power,
    inst.socketedGemId ?? null,
    firepower,
    firepowerMultiplier,
    shieldPower,
    inst.foil === true,
    inst.grantedExpire === true,
    hasGreenHat,
  )
}

export function cardDescriptionLinesForOffer(
  card: CardTemplate,
  upgradeApplications: number,
  power = 0,
  firepower = 0,
  firepowerMultiplier = 0,
  shieldPower = 0,
  foil = false,
  hasGreenHat = false,
): CardDescLine[] {
  return cardDescriptionLines(
    card,
    upgradeApplications,
    power,
    null,
    firepower,
    firepowerMultiplier,
    shieldPower,
    foil,
    false,
    hasGreenHat,
  )
}

