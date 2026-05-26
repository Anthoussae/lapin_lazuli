import type { CardId, CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { mkCardInstance } from '../factories'

/** Create one card instance and add it to the discard pile. */
export function shuffleBurdenIntoDiscard(state: GameState, templateId: CardId): GameState {
  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = mkCardInstance(newId, templateId)
  return {
    ...state,
    player: {
      ...state.player,
      nextCardInstanceSerial: serial + 1,
      deck: {
        ...state.player.deck,
        cardById: { ...state.player.deck.cardById, [inst.id]: inst },
        discardPile: [...state.player.deck.discardPile, inst.id],
      },
    },
  }
}
