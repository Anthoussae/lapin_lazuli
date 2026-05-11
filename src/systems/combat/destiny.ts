import type { GameState } from '../../core/types/state'
import type { CardInstanceId } from '../../core/types/ids'
import { cardInstanceHasDestiny } from '../cards/cardEffects'

/** Move destined cards from the draw pile into hand before the opening combat draw. */
export function putDestinyCardsInOpeningHand(state: GameState): GameState {
  const deck = state.player.deck
  const destined: CardInstanceId[] = []
  const remainingDraw: CardInstanceId[] = []
  for (const id of deck.drawPile) {
    const inst = deck.cardById[id]
    if (inst && cardInstanceHasDestiny(inst)) destined.push(id)
    else remainingDraw.push(id)
  }
  if (!destined.length) return state
  return {
    ...state,
    player: {
      ...state.player,
      deck: {
        ...deck,
        drawPile: remainingDraw,
        hand: [...deck.hand, ...destined],
      },
    },
  }
}
