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
  firepower: number,
  firepowerMultiplier: number,
  shieldPower: number,
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
    descriptionLines: cardDescriptionLinesForInstance(
      template,
      preview,
      power,
      firepower,
      firepowerMultiplier,
      shieldPower,
    ),
    socketedGemId: preview.socketedGemId ?? null,
    foil: preview.foil === true,
  }
}

/** Card face data for deck travel FX from a live instance. */
export function cardTravelPayloadForInstance(
  template: CardTemplate,
  inst: CardInstance,
  power: number,
  firepower: number,
  firepowerMultiplier: number,
  shieldPower: number,
): CardTravelPayload {
  return cardSocketFlipPayload(
    template,
    inst,
    power,
    firepower,
    firepowerMultiplier,
    shieldPower,
    inst.socketedGemId ?? null,
  )
}

/** Card face data for the foil flip overlay (before / after foiling). */
export function cardFoilFlipPayload(
  template: CardTemplate,
  inst: CardInstance,
  power: number,
  firepower: number,
  firepowerMultiplier: number,
  shieldPower: number,
  foil: boolean,
): CardTravelPayload {
  const preview: CardInstance = foil ? { ...inst, foil: true } : inst
  return cardSocketFlipPayload(
    template,
    preview,
    power,
    firepower,
    firepowerMultiplier,
    shieldPower,
    preview.socketedGemId ?? null,
  )
}
