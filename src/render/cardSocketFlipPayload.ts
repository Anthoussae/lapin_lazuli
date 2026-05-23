import type { CardInstance } from '../core/types/state'
import type { GemId } from '../core/types/ids'
import type { CardTemplate } from '../data/cards'
import { cardDescriptionLinesForInstance, formatCardInstanceDisplayName } from '../ui/describe'
import { cardInstanceInkCost } from '../systems/cards/inkCost'
import type { CardTravelPayload } from './CardTravelContext'

/** Card face data for the socket-flip overlay (before / after gem). */
export function cardSocketFlipPayload(
  template: CardTemplate,
  inst: CardInstance,
  power: number,
  firepowerMultiplier: number,
  socketedGemId: GemId | null,
): CardTravelPayload {
  const preview: CardInstance = { ...inst, socketedGemId }
  const ink = cardInstanceInkCost(preview, template)
  const inkLabel = preview.exhausted ? 'Exhausted' : ink !== null ? String(ink) : null
  return {
    cardId: template.id,
    name: formatCardInstanceDisplayName(template, preview),
    nameUpgraded: preview.upgrades > 0,
    inkLabel,
    descriptionLines: cardDescriptionLinesForInstance(template, preview, power, firepowerMultiplier),
  }
}
