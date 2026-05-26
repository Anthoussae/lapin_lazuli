import type { CardInstance } from '../../core/types/state'
import type { GemId } from '../../core/types/ids'
import type { Effect } from '../../data/effects'
import { cardTemplateById, Cards } from '../../data/cards'
import { Gems } from '../../data/gems'
import { applyCardInstanceEffectModifiers } from './upgrades'

export function cardBaseEffects(templateId: string, socketedGemId: GemId | null = null): ReadonlyArray<Effect> {
  const card = cardTemplateById(templateId)
  if (!card) return []
  const effects: Effect[] = [...card.effects]
  if (socketedGemId) {
    const gem = Gems[socketedGemId]
    if (gem) effects.push(...gem.effects)
  }
  return effects
}

export function cardInstanceBaseEffects(inst: CardInstance): ReadonlyArray<Effect> {
  return cardBaseEffects(inst.templateId, inst.socketedGemId ?? null)
}

export function cardInstanceHasDestiny(inst: CardInstance): boolean {
  return cardInstanceBaseEffects(inst).some((fx) => fx.kind === 'DESTINY')
}

/** Play effects with instance upgrades and foil (before power / fire / shield boosts). */
export function cardInstanceResolvedPlayEffects(inst: CardInstance): ReadonlyArray<Effect> {
  return applyCardInstanceEffectModifiers(
    cardInstancePlayEffects(inst),
    inst.upgrades,
    inst.foil === true,
  )
}

/** Effects that resolve when a card is played (excludes combat-start / deck-meta kinds). */
export function effectsResolvedOnCardPlay(effects: ReadonlyArray<Effect>): ReadonlyArray<Effect> {
  return effects.filter(
    (fx) =>
      fx.kind !== 'DESTINY' &&
      fx.kind !== 'CONSUME' &&
      fx.kind !== 'EXHAUST' &&
      fx.kind !== 'UPGRADE_AFTER_CASTING' &&
      fx.kind !== 'CONSUME_IF_IN_HAND_AT_TURN_END',
  )
}

/** Card effects resolved when the card is played (excludes combat-start-only effects). */
export function cardInstancePlayEffects(inst: CardInstance): ReadonlyArray<Effect> {
  return effectsResolvedOnCardPlay(cardInstanceBaseEffects(inst))
}

export function cardInstanceExhausts(inst: CardInstance): boolean {
  const tmpl = cardTemplateById(inst.templateId)
  if (tmpl?.exhaust) return true
  return cardInstanceBaseEffects(inst).some((fx) => fx.kind === 'EXHAUST')
}

export function cardInstanceRetains(inst: CardInstance): boolean {
  return cardTemplateById(inst.templateId)?.retain === true
}

export function cardInstanceConsumesIfInHandAtTurnEnd(inst: CardInstance): boolean {
  return cardInstanceBaseEffects(inst).some((fx) => fx.kind === 'CONSUME_IF_IN_HAND_AT_TURN_END')
}

export function cardInstanceUpgradesAfterCasting(inst: CardInstance): boolean {
  return cardInstanceBaseEffects(inst).some((fx) => fx.kind === 'UPGRADE_AFTER_CASTING')
}

export function cardInstanceConsumes(inst: CardInstance): boolean {
  const tmpl = Cards[inst.templateId]
  if (tmpl?.tags.includes('consume')) return true
  return cardInstanceBaseEffects(inst).some((fx) => fx.kind === 'CONSUME')
}

/** True when playing this card opens the hand-selection modal instead of resolving immediately. */
export function cardInstanceOpensHandSelection(inst: CardInstance): boolean {
  const scaled = cardInstanceResolvedPlayEffects(inst)
  const handSelectionEffect = scaled.find(
    (fx): fx is Extract<Effect, { kind: 'UPGRADE_SELECTED_CARD' | 'CONSUME_SELECTED_CARD' }> =>
      fx.kind === 'UPGRADE_SELECTED_CARD' || fx.kind === 'CONSUME_SELECTED_CARD',
  )
  if (!handSelectionEffect || handSelectionEffect.numberOfTargets <= 0) return false
  if (handSelectionEffect.kind === 'CONSUME_SELECTED_CARD') return true
  return handSelectionEffect.upgradeAmount > 0
}
