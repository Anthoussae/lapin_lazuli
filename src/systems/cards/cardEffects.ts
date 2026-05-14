import type { CardInstance } from '../../core/types/state'
import type { GemId } from '../../core/types/ids'
import type { Effect } from '../../data/effects'
import { cardTemplateById, Cards } from '../../data/cards'
import { Gems } from '../../data/gems'

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

/** Card effects resolved when the card is played (excludes combat-start-only effects). */
export function cardInstancePlayEffects(inst: CardInstance): ReadonlyArray<Effect> {
  return cardInstanceBaseEffects(inst).filter(
    (fx) =>
      fx.kind !== 'DESTINY' &&
      fx.kind !== 'CONSUME' &&
      fx.kind !== 'EXHAUST' &&
      fx.kind !== 'UPGRADE_AFTER_CASTING' &&
      fx.kind !== 'CONSUME_IF_IN_HAND_AT_TURN_END',
  )
}

export function cardInstanceExhausts(inst: CardInstance): boolean {
  const tmpl = cardTemplateById(inst.templateId)
  if (tmpl?.exhaust) return true
  return cardInstanceBaseEffects(inst).some((fx) => fx.kind === 'EXHAUST')
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
