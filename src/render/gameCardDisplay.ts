import type { CardInstance } from '../core/types/state'
import type { CardId, GemId } from '../core/types/ids'
import type { CardTemplate } from '../data/cards'
import {
  cardDescriptionLinesForInstance,
  cardDescriptionLinesForOffer,
  formatCardInstanceDisplayName,
  formatCardName,
} from '../ui/describe'
import type { CardDescLine } from '../ui/describe'
import { cardInstanceInkCost, cardInstanceInkCostModified } from '../systems/cards/inkCost'
import type { PowerDisplayContext } from '../systems/combat/powerDisplay'
import type { CardTravelPayload } from './CardTravelContext'

/** Canonical card face data — single source of truth for {@link GameCardView} and travel / flip FX. */
export type GameCardDisplay = Readonly<{
  cardId?: CardId
  name: string
  nameUpgraded: boolean
  inkLabel: string | null
  inkModified: boolean
  descriptionLines: ReadonlyArray<CardDescLine>
  socketedGemId: GemId | null
  foil: boolean
  combatDisabled: boolean
  exhausted: boolean
}>

export type CardInkDisplayOptions = Readonly<{
  freeFirstFireSpell?: boolean
  nextSpellCosts0?: boolean
}>

const EMPTY_INK_OPTS: CardInkDisplayOptions = {}

export function buildGameCardDisplayForInstance(
  template: CardTemplate,
  inst: CardInstance,
  powerDisplay: PowerDisplayContext,
  gameLevel: number,
  inkOpts: CardInkDisplayOptions = EMPTY_INK_OPTS,
  nameOverride?: string,
): GameCardDisplay {
  const ink = cardInstanceInkCost(inst, template, inkOpts)
  const inkModified = cardInstanceInkCostModified(inst, template, inkOpts)
  return {
    cardId: template.id,
    name: nameOverride ?? formatCardInstanceDisplayName(template, inst),
    nameUpgraded: inst.upgrades > 0,
    inkLabel: inst.exhausted ? 'Exhausted' : ink !== null ? String(ink) : null,
    inkModified,
    descriptionLines: cardDescriptionLinesForInstance(template, inst, powerDisplay, gameLevel),
    socketedGemId: inst.socketedGemId ?? null,
    foil: inst.foil === true,
    combatDisabled: inst.disabled === true,
    exhausted: inst.exhausted === true,
  }
}

export function buildGameCardDisplayForOffer(
  template: CardTemplate,
  upgradeApplications: number,
  powerDisplay: PowerDisplayContext,
  foil = false,
  gameLevel = 1,
): GameCardDisplay {
  const ink = template.cost !== null && template.cost !== undefined ? template.cost : null
  return {
    cardId: template.id,
    name: formatCardName(template.name, upgradeApplications),
    nameUpgraded: upgradeApplications > 0,
    inkLabel: ink !== null ? String(ink) : null,
    inkModified: false,
    descriptionLines: cardDescriptionLinesForOffer(
      template,
      upgradeApplications,
      powerDisplay,
      foil,
      gameLevel,
    ),
    socketedGemId: null,
    foil,
    combatDisabled: false,
    exhausted: false,
  }
}

/** Subset used by card travel / socket-flip flyers (no combat-only flags). */
export function toCardTravelPayload(display: GameCardDisplay): CardTravelPayload {
  return {
    cardId: display.cardId,
    name: display.name,
    nameUpgraded: display.nameUpgraded,
    inkLabel: display.inkLabel,
    inkModified: display.inkModified,
    descriptionLines: display.descriptionLines,
    socketedGemId: display.socketedGemId,
    foil: display.foil,
  }
}

export function gameCardDisplayFromTravelPayload(payload: CardTravelPayload): GameCardDisplay {
  return {
    cardId: payload.cardId,
    name: payload.name,
    nameUpgraded: payload.nameUpgraded === true,
    inkLabel: payload.inkLabel,
    inkModified: payload.inkModified === true,
    descriptionLines: payload.descriptionLines,
    socketedGemId: payload.socketedGemId ?? null,
    foil: payload.foil === true,
    combatDisabled: false,
    exhausted: payload.inkLabel === 'Exhausted',
  }
}
