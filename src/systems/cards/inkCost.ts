import type { CardTemplate } from '../../data/cards'
import type { CardInstance } from '../../core/types/state'

export type InkCostOpts = Readonly<{
  /** Phoenix-feather Quill combat buff. */
  freeFirstFireSpell?: boolean
  /** Paintbrush combat buff: next spell costs 0 (preview all cards as 0). */
  nextSpellCosts0?: boolean
}>

export function cardTemplateHasNullInkCost(card: CardTemplate): boolean {
  return card.cost === null
}

export function cardHasFireTag(tags: ReadonlyArray<string>): boolean {
  return tags.includes('fire')
}

/** Null means the card cannot be cast (distinct from 0 ink). */
export function cardInstanceInkCost(
  inst: CardInstance,
  card: CardTemplate,
  opts?: InkCostOpts,
): number | null {
  if (cardTemplateHasNullInkCost(card)) return null
  const base = inst.costOverride ?? card.cost
  if (opts?.nextSpellCosts0) return 0
  if (opts?.freeFirstFireSpell && cardHasFireTag(card.tags)) return 0
  return base
}

/** True when displayed ink differs from the printed cost on the card (e.g. relic discount). */
export function cardInstanceInkCostModified(
  inst: CardInstance,
  card: CardTemplate,
  opts?: InkCostOpts,
): boolean {
  const effective = cardInstanceInkCost(inst, card, opts)
  const printed = inst.costOverride ?? card.cost
  if (effective === null || printed === null) return false
  if (opts?.nextSpellCosts0 && effective === 0) return true
  return effective !== printed
}

export function cardInstanceLooksExhausted(inst: CardInstance): boolean {
  return inst.exhausted || inst.disabled
}

export function cardInstanceIsPlayable(
  inst: CardInstance,
  card: CardTemplate,
  energy: number,
  opts?: InkCostOpts,
): boolean {
  if (cardInstanceLooksExhausted(inst)) return false
  const cost = cardInstanceInkCost(inst, card, opts)
  if (cost === null) return false
  return energy >= cost
}

export function handHasPlayableCard(
  handIds: readonly string[],
  cardById: Record<string, CardInstance | undefined>,
  getTemplate: (templateId: CardInstance['templateId']) => CardTemplate | undefined,
  energy: number,
  opts?: InkCostOpts,
): boolean {
  for (const cid of handIds) {
    const inst = cardById[cid]
    if (!inst) continue
    const t = getTemplate(inst.templateId)
    if (t && cardInstanceIsPlayable(inst, t, energy, opts)) return true
  }
  return false
}
