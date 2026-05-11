import type { CardTemplate } from '../../data/cards'
import type { CardInstance } from '../../core/types/state'

export function cardTemplateHasNullInkCost(card: CardTemplate): boolean {
  return card.cost === null
}

/** Null means the card cannot be cast (distinct from 0 ink). */
export function cardInstanceInkCost(inst: CardInstance, card: CardTemplate): number | null {
  if (cardTemplateHasNullInkCost(card)) return null
  return inst.costOverride ?? card.cost
}

export function cardInstanceIsPlayable(inst: CardInstance, card: CardTemplate, energy: number): boolean {
  if (inst.exhausted) return false
  const cost = cardInstanceInkCost(inst, card)
  if (cost === null) return false
  return energy >= cost
}
