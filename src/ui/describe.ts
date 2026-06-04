import type { CardTemplate } from '../data/cards'
import { cardTemplateHasNullInkCost } from '../systems/cards/inkCost'
import type { Effect } from '../data/effects'
import { Gems, type GemTemplate } from '../data/gems'
import type { RelicTemplate, TriggerDef } from '../data/relics'
import type { GemId } from '../core/types/ids'
import type { CardInstance } from '../core/types/state'
import { cardBaseEffects } from '../systems/cards/cardEffects'
import { cardHasFireDamageTags } from '../systems/cards/firepower'
import { cardHasAddShieldTag } from '../systems/cards/shieldPower'
import {
  displayAddBunnies,
  displayFireDamage,
  displayOutgoingPlayerDamage,
  displayPlayerPoisonHpLoss,
  displayShieldGain,
  EMPTY_POWER_DISPLAY,
  greenHatPoisonBoostCeil,
  type PowerDisplayContext,
} from '../systems/combat/powerDisplay'
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

/** Exact multiplier for card text (e.g. 2.75); bunny count after multiply is rounded separately. */
export function formatBunnyMultiplier(amount: number): string {
  const x = Math.round(amount * 100) / 100
  if (Number.isInteger(x)) return String(x)
  return x.toFixed(2).replace(/\.?0+$/, '')
}

export function describeEffect(fx: Effect): string {
  switch (fx.kind) {
    case 'DRAW_CARDS':
      return `draw ${fx.amount} ${plural(fx.amount, 'card')}`
    case 'ADD_BUNNIES':
      return `add ${fx.amount} ${plural(fx.amount, 'bunny', 'bunnies')}`
    case 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL':
      return `add ${fx.multiplier} ${plural(fx.multiplier, 'bunny', 'bunnies')} per level`
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
    case 'SHATTER':
      return 'destroy all enemy shields'
    case 'CRITICAL':
      return `${fx.chancePercent}% critical chance, ${fx.multiplierPercent}% critical multiplier`
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
        ? `gain ${fx.amount} bunny power until end of combat`
        : `gain ${fx.amount} bunny power`
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
      return fx.numberOfTargets === 1
        ? 'consume up to 1 selected card'
        : `consume up to ${fx.numberOfTargets} selected cards`
    case 'UPGRADE_SPECIFIC_CARD': {
      // Use template id; display formatting can be improved later.
      const pretty = fx.target === 'MULTIBUNNIES' ? 'Multibunnies' : fx.target
      if (fx.numberOfTargets === 1) return `upgrade your ${pretty}`
      return `upgrade ${fx.numberOfTargets} of your ${pretty}`
    }
    case 'UPGRADE_RANDOM_DECK_CARDS':
      return `upgrade ${fx.numberOfTargets} random ${plural(fx.numberOfTargets, 'card')} in your deck`
    case 'UPGRADE_ADDED_CARD':
      return 'upgrade it'
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
      if (fx.enchantmentId === 'POISON') return `enemy takes ${amt} poison damage each turn`
      if (fx.enchantmentId === 'FLAMEWREATH') return `deal ${amt} fire damage when attacked`
      if (fx.enchantmentId === 'GUARDIAN_ANGEL') return `Enchantment. Gain +${amt} shields each turn`
      if (fx.enchantmentId === 'BUNNYFORM') {
        return `Enchantment. At the start of your turn, gain +${amt} bunny power until end of combat`
      }
      if (fx.enchantmentId === 'BUBBLE') return amt === 1 ? 'gain 1 bubble' : `gain ${amt} bubbles`
      if (fx.enchantmentId === 'ANTI_MAGIC_SHELL') {
        const word = amt === 1 ? 'shell' : 'shells'
        return `Gain ${amt} anti-magic ${word}.`
      }
      if (fx.enchantmentId === 'BUNNY_RESIST') return 'reduce incoming bunny damage by 75%'
      if (fx.enchantmentId === 'FIRE_RESIST') return 'reduce incoming fire damage by 75%'
      if (fx.enchantmentId === 'POISON_RESIST') return 'reduce incoming poison damage by 75%'
      if (fx.enchantmentId === 'DIZZY') return amt === 1 ? 'draw 1 fewer card each turn' : `draw ${amt} fewer cards each turn`
      if (fx.enchantmentId === 'RUST') {
        return amt === 3 ? 'decrease shield power by 3' : `decrease shield power by ${amt}`
      }
      if (fx.enchantmentId === 'AMPLIFY_DAMAGE') {
        return amt <= 1 ? 'increase incoming damage by 30%' : `increase incoming damage by 30% (${amt} stacks)`
      }
      if (fx.enchantmentId === 'WEAKEN') return 'decrease outgoing damage by 50%'
      return `apply ${fx.enchantmentId}`
    }
    case 'DODGE':
      return `${Math.round(fx.chance * 100)}% chance to dodge incoming attacks`
    case 'DISPEL':
      return `dispel ${fx.amount}`
    case 'MODIFY_GAME_LEVEL': {
      const amt = fx.amount
      const abs = Math.abs(amt)
      if (amt === 0) return 'change your level by 0'
      return amt < 0 ? `reduce your level by ${abs}` : `increase your level by ${abs}`
    }
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

function embedsCriticalInEffect(effects: ReadonlyArray<Effect>): boolean {
  return effects.some((fx) => fx.kind === 'CRITICAL')
}

function splitVisibleAndTooltipOnlyKeywordIds(
  ids: ReadonlyArray<CardKeywordId>,
  opts: Readonly<{
    embedsEnchantmentInEffect: boolean
    embedsCriticalInEffect: boolean
    embedsPiercingInEffect: boolean
  }>,
): Readonly<{ visible: CardKeywordId[]; tooltipOnly: CardKeywordId[] }> {
  const visible = ids.filter(
    (id) =>
      id !== 'socketed' &&
      !(id === 'enchantment' && opts.embedsEnchantmentInEffect) &&
      !(id === 'critical' && opts.embedsCriticalInEffect) &&
      !(id === 'piercing' && opts.embedsPiercingInEffect),
  )
  const tooltipOnly = ids.filter((id) => !visible.includes(id))
  return { visible, tooltipOnly }
}

function keywordDescriptionLines(
  visible: ReadonlyArray<CardKeywordId>,
  tooltipOnly: ReadonlyArray<CardKeywordId>,
): CardDescLine[] {
  const lines: CardDescLine[] = []
  if (visible.length) lines.push({ kind: 'keywords', ids: visible })
  if (tooltipOnly.length) lines.push({ kind: 'keywords', ids: tooltipOnly, tooltipOnly: true })
  return lines
}

const RELIC_TRIGGER_LINE: Partial<Record<TriggerDef['on'], (eff: string, trig: TriggerDef) => string>> = {
  onPickup: (eff) => capitalizeFirst(eff),
  combat_start: (eff) => `At combat start, ${eff}.`,
  turn_start: (eff) => `At turn start, ${eff}.`,
  fourthSpellCastPerTurn: (eff) => `After you cast your fourth spell this turn, ${eff}.`,
  castSpellWithCostAboveAmount: (eff, trig) =>
    `Whenever you cast a spell that costs ${trig.amount ?? 2} or more ink, ${eff}.`,
  draw_starting_hand: (eff) => `When drawing your starting hand, ${eff}.`,
  onNonOpenerCardDraw: (eff) => `Whenever you draw a card other than into your opening hand, ${eff}.`,
  onPlayerUnblockedDamage: (eff) => `The first time you take damage each combat, ${eff}.`,
  onTotalAttackBlock: (eff) => `Whenever you completely block an enemy's attack, ${eff}.`,
  potion_played: (eff) => `Whenever you use a potion, ${eff}.`,
  combat_end: (eff) => `At the end of each combat, ${eff}.`,
  onRest: (eff) => `When you rest, ${eff}.`,
  onSleep: (eff) => `When you sleep, ${eff}.`,
  onChoosingPath: (eff) => `Whenever you choose a combat path, ${eff}.`,
  onAddCardToDeck: (eff) => `Whenever you add a card to your deck, ${eff}.`,
  onAddCardOfType: (eff, trig) =>
    `Whenever you add a ${trig.cardTag ?? 'matching'} card to your deck, ${eff}.`,
}

export function describeRelicTrigger(trig: TriggerDef): string {
  const eff = describeEffect(trig.effect)
  return RELIC_TRIGGER_LINE[trig.on]?.(eff, trig) ?? eff
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

function cardEmbedsPiercingInEffect(card: CardTemplate, effects: ReadonlyArray<Effect>): boolean {
  return (
    card.tags.includes('piercing') &&
    effects.some((fx) => fx.kind === 'HP_LOSS' && (fx.target ?? 'selectedEnemy') === 'selectedEnemy')
  )
}

function poisonHpLossDisplayAmount(
  card: CardTemplate,
  fx: Effect & { kind: 'HP_LOSS' },
  powerDisplay: PowerDisplayContext,
): number {
  const t = fx.target ?? 'selectedEnemy'
  if (powerDisplay.hasGreenHat && card.tags.includes('poison')) {
    return displayPlayerPoisonHpLoss(fx.amount, powerDisplay, t)
  }
  return displayOutgoingPlayerDamage(fx.amount, powerDisplay)
}

function piercingHpLossSegments(
  card: CardTemplate,
  base: number,
  display: number,
): CardDescSegment[] {
  const suffix = card.tags.includes('poison') ? ' poison damage.' : ' damage.'
  return [txt('Piercing. Deal '), amtSeg(base, display), txt(suffix)]
}

function piercingHpLossPlainText(card: CardTemplate, base: number, display: number): string {
  const suffix = card.tags.includes('poison') ? ' poison damage.' : ' damage.'
  const amountText = display === base ? `${display}` : `${base}→${display}`
  return capitalizeCardDescriptionText(`Piercing. Deal ${amountText}${suffix}`)
}

function shatterThenFireDamageEffects(
  effects: ReadonlyArray<Effect>,
): Readonly<{ baseDamage: Effect & { kind: 'DEAL_DAMAGE' }; displayDamage: Effect & { kind: 'DEAL_DAMAGE' } }> | null {
  if (effects.length < 2) return null
  if (effects[0].kind !== 'SHATTER' || effects[1].kind !== 'DEAL_DAMAGE') return null
  return { baseDamage: effects[1], displayDamage: effects[1] }
}

function shatterThenFireDamageText(
  card: CardTemplate,
  baseDamage: number,
  displayDamage: number,
  powerDisplay: PowerDisplayContext,
): string {
  const boosted = cardHasFireDamageTags(card.tags)
    ? displayFireDamage(displayDamage, powerDisplay)
    : displayDamage
  const display = displayOutgoingPlayerDamage(boosted, powerDisplay)
  const amountText = display === baseDamage ? `${display}` : `${baseDamage}→${display}`
  return capitalizeCardDescriptionText(`Destroy all enemy shields, then deal ${amountText} fire damage.`)
}

function shatterThenFireDamageSegments(
  card: CardTemplate,
  baseDamage: number,
  displayDamage: number,
  powerDisplay: PowerDisplayContext,
): CardDescSegment[] {
  const boosted = cardHasFireDamageTags(card.tags)
    ? displayFireDamage(displayDamage, powerDisplay)
    : displayDamage
  const display = displayOutgoingPlayerDamage(boosted, powerDisplay)
  return capitalizeFirstSegment([
    txt('Destroy all enemy shields, then deal '),
    amtSeg(baseDamage, display),
    txt(' fire damage.'),
  ])
}

function describeEffectsOrConsumeFallback(
  card: CardTemplate,
  scaled: ReadonlyArray<Effect>,
  socketedGemId: GemId | null = null,
  grantedExpire = false,
  powerDisplay: PowerDisplayContext = EMPTY_POWER_DISPLAY,
): string {
  const lines: string[] = []
  const unplayable = unplayableDescriptionLine(card)
  if (unplayable) lines.push(unplayable)
  const visibleFx = scaled.filter((fx) => !isDescriptionKeywordEffect(fx))
  const shatterFire = shatterThenFireDamageEffects(visibleFx)
  if (shatterFire) {
    lines.push(
      shatterThenFireDamageText(
        card,
        shatterFire.baseDamage.amount,
        shatterFire.displayDamage.amount,
        powerDisplay,
      ),
    )
  } else if (visibleFx.length) {
    lines.push(
      ...visibleFx.map((fx) => {
        if (fx.kind === 'HP_LOSS' && card.tags.includes('piercing') && (fx.target ?? 'selectedEnemy') === 'selectedEnemy') {
          const display = poisonHpLossDisplayAmount(card, fx, powerDisplay)
          return piercingHpLossPlainText(card, fx.amount, display)
        }
        return capitalizeCardDescriptionText(`${describeEffect(fx)}.`)
      }),
    )
  }
  const keywordIds = cardKeywordIds(card, socketedGemId, grantedExpire).filter(
    (id) =>
      !(id === 'critical' && embedsCriticalInEffect(visibleFx)) &&
      !(id === 'piercing' && cardEmbedsPiercingInEffect(card, visibleFx)),
  )
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
  /** `tooltipOnly` keywords are omitted from card text but still power hover tooltips. */
  | { kind: 'keywords'; ids: ReadonlyArray<CardKeywordId>; tooltipOnly?: boolean }

function amtSeg(base: number, display: number, format: CardDescAmountFormat = 'integer'): CardDescSegment {
  return { kind: 'amount', base, display, format }
}

function txt(text: string): CardDescSegment {
  return { kind: 'text', text }
}

const EMBEDDED_ENCHANTMENT_KEYWORD_IDS = new Set(['STONESKIN', 'HARE_RAISING', 'WARM', 'GUARDIAN_ANGEL'])

function enchantmentPowerGainSegments(
  enchantmentId: string,
  baseAmt: number,
  displayAmt: number,
): CardDescSegment[] | null {
  if (enchantmentId === 'GUARDIAN_ANGEL') {
    return [txt('Enchantment. Gain +'), amtSeg(baseAmt, displayAmt), txt(' shields each turn.')]
  }
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
  powerDisplay: PowerDisplayContext,
  gameLevel: number,
): CardDescLine {
  const segments = capitalizeFirstSegment(
    buildEffectSegments(card, baseFx, displayFx, powerDisplay, gameLevel),
  )
  return { kind: 'segments', segments }
}

function buildEffectSegments(
  card: CardTemplate,
  baseFx: Effect,
  displayFx: Effect,
  powerDisplay: PowerDisplayContext,
  _gameLevel: number,
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
      const display = displayAddBunnies(displayFx.amount, powerDisplay)
      return [
        txt('add '),
        amtSeg(base, display),
        txt(` ${plural(display, 'bunny', 'bunnies')}.`),
      ]
    }
    case 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL': {
      if (baseFx.kind !== 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL' || displayFx.kind !== 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL') {
        return [txt(`${describeEffect(displayFx)}.`)]
      }
      return [
        txt('add '),
        amtSeg(baseFx.multiplier, displayFx.multiplier),
        txt(` ${plural(displayFx.multiplier, 'bunny', 'bunnies')} per level.`),
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
      const base = baseFx.kind === 'HP_LOSS' ? baseFx.amount : displayFx.amount
      const t = displayFx.target ?? 'selectedEnemy'
      const display = poisonHpLossDisplayAmount(card, displayFx, powerDisplay)
      if (card.tags.includes('piercing') && t === 'selectedEnemy') {
        return piercingHpLossSegments(card, base, display)
      }
      const lossSuffix = card.tags.includes('poison') ? ' poison damage.' : ` ${plural(display, 'hp')}.`
      if (t === 'player') {
        return [txt('lose '), amtSeg(base, display), txt(lossSuffix)]
      }
      return [txt('enemy loses '), amtSeg(base, display), txt(lossSuffix)]
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
      const display = displayShieldGain(
        displayFx.amount,
        powerDisplay,
        cardHasAddShieldTag(card.tags),
      )
      return [
        txt('gain '),
        amtSeg(base, display),
        txt(` ${plural(display, 'shield')}.`),
      ]
    }
    case 'GAIN_LOCKED_SHIELD': {
      const base = baseFx.kind === 'GAIN_LOCKED_SHIELD' ? baseFx.amount : displayFx.amount
      const display = displayShieldGain(displayFx.amount, powerDisplay, false)
      return [
        txt('gain '),
        amtSeg(base, display),
        txt(` locked ${plural(display, 'shield')}.`),
      ]
    }
    case 'DEAL_DAMAGE': {
      const base = baseFx.kind === 'DEAL_DAMAGE' ? baseFx.amount : displayFx.amount
      const boosted = cardHasFireDamageTags(card.tags)
        ? displayFireDamage(displayFx.amount, powerDisplay)
        : displayFx.amount
      const display = displayOutgoingPlayerDamage(boosted, powerDisplay)
      return [
        txt('deal '),
        amtSeg(base, display),
        txt(cardHasFireDamageTags(card.tags) ? ' fire damage.' : ' damage.'),
      ]
    }
    case 'SHATTER':
      return [txt('destroy all enemy shields.')]
    case 'CRITICAL': {
      if (baseFx.kind !== 'CRITICAL' || displayFx.kind !== 'CRITICAL') {
        return [txt(`${describeEffect(displayFx)}.`)]
      }
      return [
        amtSeg(baseFx.chancePercent, displayFx.chancePercent),
        txt('% critical chance. '),
        amtSeg(baseFx.multiplierPercent, displayFx.multiplierPercent),
        txt('% critical multiplier.'),
      ]
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
        txt(' bunny power.'),
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
      if (displayFx.numberOfTargets === 1) return [txt('consume up to 1 selected card.')]
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
        const boosted = displayFireDamage(display, powerDisplay)
        return [txt('deal '), amtSeg(base, boosted), txt(' fire damage when attacked.')]
      }
      if (displayFx.enchantmentId === 'POISON') {
        const displayAdj = powerDisplay.hasGreenHat ? greenHatPoisonBoostCeil(display) : display
        return [txt('enemy takes '), amtSeg(base, displayAdj), txt(' poison damage each turn.')]
      }
      if (displayFx.enchantmentId === 'BUBBLE') {
        const word = display === 1 ? 'bubble' : 'bubbles'
        return [txt('gain '), amtSeg(base, display), txt(` ${word}.`)]
      }
      if (displayFx.enchantmentId === 'ANTI_MAGIC_SHELL') {
        const word = display === 1 ? 'shell' : 'shells'
        return [txt('gain '), amtSeg(base, display), txt(` anti-magic ${word}.`)]
      }
      if (displayFx.enchantmentId === 'DIZZY') {
        const cardWord = display === 1 ? 'card' : 'cards'
        return [txt('draw '), amtSeg(base, display), txt(` fewer ${cardWord} each turn.`)]
      }
      if (displayFx.enchantmentId === 'RUST') {
        return [txt('decrease shield power by '), amtSeg(base, display), txt('.')]
      }
      if (displayFx.enchantmentId === 'WEAKEN') {
        return [txt('decrease outgoing damage by '), amtSeg(50, 50), txt('%.')]
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
  powerDisplay: PowerDisplayContext,
  socketedGemId: GemId | null = null,
  foil = false,
  grantedExpire = false,
  gameLevel = 1,
): CardDescLine[] {
  const baseEffects = cardBaseEffects(card.id, socketedGemId)
  const lines: CardDescLine[] = []
  const unplayable = unplayableDescriptionLine(card)
  if (unplayable) lines.push(plainCardDescLine(unplayable))
  if (!baseEffects.length) {
    const keywordIds = cardKeywordIds(card, socketedGemId, grantedExpire)
    const keywordLines: CardDescLine[] = keywordIds.length ? [{ kind: 'keywords', ids: keywordIds }] : []
    return [...lines, ...keywordLines]
  }
  const baseScaled = applyCardInstanceEffectModifiers(baseEffects, 0, foil).filter(
    (fx) => !isDescriptionKeywordEffect(fx),
  )
  const scaled = applyCardInstanceEffectModifiers(baseEffects, upgrades, foil).filter(
    (fx) => !isDescriptionKeywordEffect(fx),
  )
  const shatterFire =
    baseScaled.length >= 2 &&
    baseScaled[0].kind === 'SHATTER' &&
    scaled[0].kind === 'SHATTER' &&
    baseScaled[1].kind === 'DEAL_DAMAGE' &&
    scaled[1].kind === 'DEAL_DAMAGE'
      ? { baseDamage: baseScaled[1].amount, displayDamage: scaled[1].amount }
      : null
  const effectLines: CardDescLine[] = shatterFire
    ? [{ kind: 'segments', segments: shatterThenFireDamageSegments(card, shatterFire.baseDamage, shatterFire.displayDamage, powerDisplay) }]
    : scaled.map((fx, i) => effectDescriptionLine(card, baseScaled[i] ?? fx, fx, powerDisplay, gameLevel))
  const embedsEnchantmentInEffect = scaled.some(
    (fx) => fx.kind === 'APPLY_ENCHANTMENT' && EMBEDDED_ENCHANTMENT_KEYWORD_IDS.has(fx.enchantmentId),
  )
  const { visible: visibleKeywordIds, tooltipOnly: tooltipOnlyKeywordIds } =
    splitVisibleAndTooltipOnlyKeywordIds(cardKeywordIds(card, socketedGemId, grantedExpire), {
      embedsEnchantmentInEffect,
      embedsCriticalInEffect: embedsCriticalInEffect(scaled),
      embedsPiercingInEffect: cardEmbedsPiercingInEffect(card, scaled),
    })
  const keywordLines = keywordDescriptionLines(visibleKeywordIds, tooltipOnlyKeywordIds)
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
  powerDisplay: PowerDisplayContext,
  gameLevel = 1,
): CardDescLine[] {
  return cardDescriptionLines(
    card,
    inst.upgrades,
    powerDisplay,
    inst.socketedGemId ?? null,
    inst.foil === true,
    inst.grantedExpire === true,
    gameLevel,
  )
}

export function cardDescriptionLinesForOffer(
  card: CardTemplate,
  upgradeApplications: number,
  powerDisplay: PowerDisplayContext,
  foil = false,
  gameLevel = 1,
): CardDescLine[] {
  return cardDescriptionLines(card, upgradeApplications, powerDisplay, null, foil, false, gameLevel)
}

