import type { CardInstance, GameState } from '../../core/types/state'
import type { CardInstanceId, GemId } from '../../core/types/ids'
import { Cards } from '../../data/cards'

export function isCardSocketable(card: CardInstance): boolean {
  const tmpl = Cards[card.templateId]
  if (!tmpl || tmpl.unsocketable || card.unsocketable) return false
  return true
}

export function deckHasSocketableCard(cardById: Readonly<Record<CardInstanceId, CardInstance>>): boolean {
  return Object.values(cardById).some(isCardSocketable)
}

export function socketableDeckCards(state: GameState): ReadonlyArray<CardInstance> {
  return Object.values(state.player.deck.cardById)
    .filter(isCardSocketable)
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function pickGemstoneCavernGem(state: GameState, gemId: GemId): GameState {
  const gc = state.gemstoneCavern
  if (!gc || gc.socketing || !gc.offered.includes(gemId)) return state
  return {
    ...state,
    gemstoneCavern: { ...gc, socketing: { gemId, selectedCardInstanceId: null } },
  }
}

export function skipGemstoneSocketing(state: GameState): GameState {
  const gc = state.gemstoneCavern
  if (!gc?.socketing) return state
  return { ...state, gemstoneCavern: { ...gc, socketing: null } }
}

export function toggleGemstoneSocketingCard(state: GameState, cardInstanceId: CardInstanceId): GameState {
  const gc = state.gemstoneCavern
  if (!gc?.socketing) return state
  const inst = state.player.deck.cardById[cardInstanceId]
  if (!inst || !isCardSocketable(inst)) return state

  const selected = gc.socketing.selectedCardInstanceId
  const nextSelected = selected === cardInstanceId ? null : cardInstanceId
  return {
    ...state,
    gemstoneCavern: {
      ...gc,
      socketing: { ...gc.socketing, selectedCardInstanceId: nextSelected },
    },
  }
}

export function confirmGemstoneSocketing(state: GameState): GameState {
  const gc = state.gemstoneCavern
  if (!gc?.socketing) return state
  const { gemId, selectedCardInstanceId } = gc.socketing
  if (!selectedCardInstanceId) return state

  const inst = state.player.deck.cardById[selectedCardInstanceId]
  if (!inst || !isCardSocketable(inst)) return state

  const nextInst: CardInstance = { ...inst, socketedGemId: gemId, unsocketable: true }
  return {
    ...state,
    gemstoneCavern: {
      offered: [],
      socketing: null,
    },
    player: {
      ...state.player,
      deck: {
        ...state.player.deck,
        cardById: { ...state.player.deck.cardById, [selectedCardInstanceId]: nextInst },
      },
    },
  }
}
