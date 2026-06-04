import type { CardInstance } from '../core/types/state'
import type { GemId } from '../core/types/ids'
import type { CardTemplate } from '../data/cards'
import type { PowerDisplayContext } from '../systems/combat/powerDisplay'
import type { CardTravelPayload } from './CardTravelContext'
import {
  buildGameCardDisplayForInstance,
  buildGameCardDisplayForOffer,
  toCardTravelPayload,
} from './gameCardDisplay'

/** Card face data for the socket-flip overlay (before / after gem). */
export function cardSocketFlipPayload(
  template: CardTemplate,
  inst: CardInstance,
  powerDisplay: PowerDisplayContext,
  socketedGemId: GemId | null,
  gameLevel = 1,
): CardTravelPayload {
  const preview: CardInstance = { ...inst, socketedGemId }
  return toCardTravelPayload(
    buildGameCardDisplayForInstance(template, preview, powerDisplay, gameLevel),
  )
}

/** Card face data for shop/reward/burden offers (no deck instance yet). */
export function cardTravelPayloadForOffer(
  template: CardTemplate,
  upgradeApplications: number,
  powerDisplay: PowerDisplayContext,
  foil = false,
  gameLevel = 1,
): CardTravelPayload {
  return toCardTravelPayload(
    buildGameCardDisplayForOffer(template, upgradeApplications, powerDisplay, foil, gameLevel),
  )
}

/** Card face data for deck travel FX from a live instance. */
export function cardTravelPayloadForInstance(
  template: CardTemplate,
  inst: CardInstance,
  powerDisplay: PowerDisplayContext,
  gameLevel = 1,
): CardTravelPayload {
  return cardSocketFlipPayload(template, inst, powerDisplay, inst.socketedGemId ?? null, gameLevel)
}

/** Card face data for the foil flip overlay (before / after foiling). */
export function cardFoilFlipPayload(
  template: CardTemplate,
  inst: CardInstance,
  powerDisplay: PowerDisplayContext,
  foil: boolean,
  gameLevel = 1,
): CardTravelPayload {
  const preview: CardInstance = foil ? { ...inst, foil: true } : inst
  return cardSocketFlipPayload(template, preview, powerDisplay, preview.socketedGemId ?? null, gameLevel)
}
