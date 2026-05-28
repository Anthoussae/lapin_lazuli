import type { CardInstanceId } from '../../core/types/ids'
import { rngInt } from '../../core/rng/rng'
import type { RngState } from '../../core/rng/rng'
import type { GameState, MysteryRoomState } from '../../core/types/state'
import { consumeCardFromDeck } from '../combat/zones'
import { determineBestOwnedCard } from '../cards/determineBestCard'
import { applyCardPickupEffects } from '../cards/pickupEffects'
import { mkCardInstance } from '../factories'
import { populateCardReward } from '../rewards/cardRewards'

export const COLLECTOR_BULK_CARD_COUNT = 2

export const COLLECTOR_SELL_PRICE_MIN = 75
export const COLLECTOR_SELL_PRICE_MAX = 125

export function rollCollectorSellPrice(rng: RngState): readonly [RngState, number] {
  return rngInt(rng, COLLECTOR_SELL_PRICE_MIN, COLLECTOR_SELL_PRICE_MAX + 1)
}

export function initCollectorMysteryRoom(
  rng: RngState,
  state: GameState,
): Readonly<{ rng: RngState; mysteryRoom: MysteryRoomState }> {
  const [rng2, best] = determineBestOwnedCard(rng, state)
  const [rng3, sellPrice] = rollCollectorSellPrice(rng2)
  return {
    rng: rng3,
    mysteryRoom: {
      roomId: 'COLLECTOR',
      collector: {
        offeredCardInstanceId: best?.id ?? null,
        cardRevealed: best == null,
        sellPrice,
        sold: false,
        bulkAccepted: false,
        bulkCards: null,
        bulkCardsAdded: 0,
      },
    },
  }
}

export function revealCollectorOfferedCard(state: GameState): GameState {
  const collector = state.mysteryRoom?.collector
  if (state.mysteryRoom?.roomId !== 'COLLECTOR' || !collector || collector.cardRevealed) {
    return state
  }
  return {
    ...state,
    mysteryRoom: {
      ...state.mysteryRoom,
      collector: { ...collector, cardRevealed: true },
    },
  }
}

export function collectorCanProceed(state: GameState): boolean {
  const collector = state.mysteryRoom?.collector
  return state.mysteryRoom?.roomId === 'COLLECTOR' && (collector?.sold === true || collector?.bulkAccepted === true)
}

export function applyCollectorAcceptBulk(state: GameState): GameState {
  const mr = state.mysteryRoom
  const collector = mr?.collector
  if (mr?.roomId !== 'COLLECTOR' || !collector || collector.sold || collector.bulkAccepted) return state

  const rolled = populateCardReward({
    rng: state.rng,
    baseRewardLevel: state.level,
    luck: state.player.luck,
    count: COLLECTOR_BULK_CARD_COUNT,
  })

  return {
    ...state,
    rng: rolled.rng,
    mysteryRoom: {
      ...mr,
      collector: {
        ...collector,
        bulkAccepted: true,
        bulkCards: rolled.offered,
        bulkCardsAdded: 0,
      },
    },
  }
}

export function applyCollectorAddBulkCard(state: GameState, index: number): GameState {
  const mr = state.mysteryRoom
  const collector = mr?.collector
  if (mr?.roomId !== 'COLLECTOR' || !collector?.bulkAccepted || !collector.bulkCards) return state

  const entry = collector.bulkCards[index]
  if (!entry || index !== collector.bulkCardsAdded) return state

  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = mkCardInstance(newId, entry.cardId, entry.upgrades, entry.foil === true)
  const cardById2 = { ...state.player.deck.cardById, [inst.id]: inst }
  const drawPile2 = [...state.player.deck.drawPile, inst.id]

  let s: GameState = {
    ...state,
    player: {
      ...state.player,
      nextCardInstanceSerial: serial + 1,
      deck: { ...state.player.deck, cardById: cardById2, drawPile: drawPile2 },
    },
    mysteryRoom: {
      ...mr,
      collector: { ...collector, bulkCardsAdded: collector.bulkCardsAdded + 1 },
    },
  }
  s = applyCardPickupEffects(s, entry.cardId)
  return s
}

export function applyCollectorSell(state: GameState): GameState {
  const mr = state.mysteryRoom
  const collector = mr?.collector
  if (mr?.roomId !== 'COLLECTOR' || !collector || collector.sold) return state

  const offeredId = collector.offeredCardInstanceId
  if (!offeredId || !state.player.deck.cardById[offeredId]) return state

  const consumed = consumeCardFromDeck(state, offeredId)
  return {
    ...consumed,
    player: { ...consumed.player, gold: consumed.player.gold + collector.sellPrice },
    mysteryRoom: {
      ...mr,
      collector: { ...collector, sold: true },
    },
  }
}
