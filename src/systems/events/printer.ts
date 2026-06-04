import type { GameEvent } from '../../reducers/events'
import type { CardInstanceId } from '../../core/types/ids'
import type { CardInstance, GameState } from '../../core/types/state'
import { addCardInstanceToDeck } from '../cards/addCardToDeck'
import { applyCardPickupEffects } from '../cards/pickupEffects'

function printerActive(state: GameState): boolean {
  return state.phase === 'EVENT' && state.mysteryRoom?.roomId === 'PRINTER'
}

function printerChoiceOpen(printer: NonNullable<GameState['mysteryRoom']>['printer']): boolean {
  return printer != null && !printer.cardFoiled && !printer.cardDuplicated
}

export function deckHasNonFoilCard(cardById: Readonly<Record<CardInstanceId, CardInstance>>): boolean {
  return Object.values(cardById).some((inst) => inst.foil !== true)
}

export function deckHasPrinterChoice(cardById: Readonly<Record<CardInstanceId, CardInstance>>): boolean {
  return Object.keys(cardById).length > 0
}

export function selectPrinterCard(state: GameState, cardInstanceId: CardInstanceId): GameState {
  if (!printerActive(state)) return state
  const printer = state.mysteryRoom?.printer
  if (!printer || !printerChoiceOpen(printer)) return state
  const inst = state.player.deck.cardById[cardInstanceId]
  if (!inst || inst.foil === true) return state

  const nextSelected = printer.selectedCardInstanceId === cardInstanceId ? null : cardInstanceId
  return {
    ...state,
    mysteryRoom: {
      ...state.mysteryRoom!,
      printer: { ...printer, selectedCardInstanceId: nextSelected },
    },
  }
}

export function selectPrinterDuplicateCard(state: GameState, cardInstanceId: CardInstanceId): GameState {
  if (!printerActive(state)) return state
  const printer = state.mysteryRoom?.printer
  if (!printer || !printerChoiceOpen(printer)) return state
  if (!state.player.deck.cardById[cardInstanceId]) return state

  const nextSelected =
    printer.duplicateSelectedCardInstanceId === cardInstanceId ? null : cardInstanceId
  return {
    ...state,
    mysteryRoom: {
      ...state.mysteryRoom!,
      printer: { ...printer, duplicateSelectedCardInstanceId: nextSelected },
    },
  }
}

export function foilPrinterCard(state: GameState): GameState {
  if (!printerActive(state)) return state
  const printer = state.mysteryRoom?.printer
  const selected = printer?.selectedCardInstanceId
  if (!printer || !printerChoiceOpen(printer) || !selected) return state

  const inst = state.player.deck.cardById[selected]
  if (!inst || inst.foil === true) return state

  return {
    ...state,
    player: {
      ...state.player,
      deck: {
        ...state.player.deck,
        cardById: {
          ...state.player.deck.cardById,
          [selected]: { ...inst, foil: true },
        },
      },
    },
    mysteryRoom: {
      ...state.mysteryRoom!,
      printer: { ...printer, selectedCardInstanceId: null, cardFoiled: true },
    },
  }
}

function cloneCardInstanceFrom(source: CardInstance, newId: CardInstanceId): CardInstance {
  return {
    id: newId,
    templateId: source.templateId,
    upgrades: source.upgrades,
    exhausted: false,
    disabled: false,
    costOverride: source.costOverride,
    socketedGemId: source.socketedGemId,
    unsocketable: source.unsocketable,
    ...(source.foil === true ? { foil: true as const } : {}),
    ...(source.sticker === true ? { sticker: true as const } : {}),
  }
}

export function duplicatePrinterCard(
  state: GameState,
): Readonly<{ state: GameState; events: GameEvent[] }> {
  if (!printerActive(state)) return { state, events: [] }
  const printer = state.mysteryRoom?.printer
  const selected = printer?.duplicateSelectedCardInstanceId
  if (!printer || !printerChoiceOpen(printer) || !selected) return { state, events: [] }

  const source = state.player.deck.cardById[selected]
  if (!source) return { state, events: [] }

  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = cloneCardInstanceFrom(source, newId)
  const added = addCardInstanceToDeck(
    { ...state, player: { ...state.player, nextCardInstanceSerial: serial + 1 } },
    inst,
  )

  let s: GameState = {
    ...added.state,
    runStats: { ...added.state.runStats, cardsObtained: added.state.runStats.cardsObtained + 1 },
    mysteryRoom: {
      ...state.mysteryRoom!,
      printer: {
        ...printer,
        duplicateSelectedCardInstanceId: null,
        cardDuplicated: true,
      },
    },
  }
  s = applyCardPickupEffects(s, source.templateId)
  return { state: s, events: added.events }
}

export function printerCanProceed(state: GameState): boolean {
  const printer = state.mysteryRoom?.printer
  return printer?.cardFoiled === true || printer?.cardDuplicated === true
}
