import type { CardInstance, GameState } from '../../core/types/state'
import type { CardInstanceId, GemId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { Gems } from '../../data/gems'
import { cardInstanceHasDestiny } from '../cards/cardEffects'

export function isCardSocketable(card: CardInstance): boolean {
  const tmpl = Cards[card.templateId]
  if (!tmpl || tmpl.unsocketable || card.unsocketable) return false
  return true
}

function isCardSocketableForGem(inst: CardInstance, gemId: GemId | null | undefined): boolean {
  if (!isCardSocketable(inst)) return false
  if (!gemId) return true
  const gem = Gems[gemId]
  if (gem?.requiresTargetWithoutDestiny && cardInstanceHasDestiny(inst)) return false
  return true
}

export function deckHasSocketableCard(cardById: Readonly<Record<CardInstanceId, CardInstance>>): boolean {
  return Object.values(cardById).some(isCardSocketable)
}

export function socketableDeckCards(state: GameState): ReadonlyArray<CardInstance> {
  const gemId = state.gemstoneCavern?.socketing?.gemId ?? null
  return Object.values(state.player.deck.cardById)
    .filter((inst) => isCardSocketableForGem(inst, gemId))
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
  if (!inst || !isCardSocketableForGem(inst, gc.socketing.gemId)) return state

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
  if (!inst || !isCardSocketableForGem(inst, gemId)) return state

  const nextInst: CardInstance = { ...inst, socketedGemId: gemId, unsocketable: true, unupgradable: true }
  return {
    ...state,
    runStats: { ...state.runStats, gemsObtained: state.runStats.gemsObtained + 1 },
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
