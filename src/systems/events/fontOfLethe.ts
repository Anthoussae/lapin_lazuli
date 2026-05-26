import type { CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { consumeCardFromDeck } from '../combat/zones'

function fontOfLetheActive(state: GameState): boolean {
  return state.phase === 'EVENT' && state.mysteryRoom?.roomId === 'FONT_OF_LETHE'
}

export function selectFontOfLetheCard(state: GameState, cardInstanceId: CardInstanceId): GameState {
  if (!fontOfLetheActive(state)) return state
  const fol = state.mysteryRoom?.fontOfLethe
  if (!fol || fol.cardForgotten) return state
  if (!state.player.deck.cardById[cardInstanceId]) return state

  const nextSelected = fol.selectedCardInstanceId === cardInstanceId ? null : cardInstanceId
  return {
    ...state,
    mysteryRoom: {
      ...state.mysteryRoom!,
      fontOfLethe: { ...fol, selectedCardInstanceId: nextSelected },
    },
  }
}

export function forgetFontOfLetheCard(state: GameState): GameState {
  if (!fontOfLetheActive(state)) return state
  const fol = state.mysteryRoom?.fontOfLethe
  const selected = fol?.selectedCardInstanceId
  if (!fol || fol.cardForgotten || !selected) return state
  if (!state.player.deck.cardById[selected]) return state

  return {
    ...consumeCardFromDeck(state, selected),
    mysteryRoom: {
      ...state.mysteryRoom!,
      fontOfLethe: { selectedCardInstanceId: null, cardForgotten: true },
    },
  }
}

export function fontOfLetheCanProceed(state: GameState): boolean {
  return state.mysteryRoom?.fontOfLethe?.cardForgotten === true
}
