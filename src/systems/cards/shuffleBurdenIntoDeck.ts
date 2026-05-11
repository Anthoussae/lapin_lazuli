import type { CardId, CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { shuffleDrawPile } from '../combat/zones'
import { mkCardInstance } from '../factories'

/** Create one card instance, add it to the draw pile, and shuffle the pile. */
export function shuffleBurdenIntoDeck(state: GameState, templateId: CardId): GameState {
  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = mkCardInstance(newId, templateId)
  const s: GameState = {
    ...state,
    player: {
      ...state.player,
      nextCardInstanceSerial: serial + 1,
      deck: {
        ...state.player.deck,
        cardById: { ...state.player.deck.cardById, [inst.id]: inst },
        drawPile: [...state.player.deck.drawPile, inst.id],
      },
    },
  }
  return shuffleDrawPile(s)
}
