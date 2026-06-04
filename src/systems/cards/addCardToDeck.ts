import type { GameEvent } from '../../reducers/events'
import type { CardInstance, GameState } from '../../core/types/state'
import { applyAddCardToDeckRelicTriggers } from '../relics/triggers'

export type AddCardToDeckPile = 'drawPile' | 'discardPile'

/** Permanently adds a card instance to the run deck and fires `onAddCardToDeck` relic triggers. */
export function addCardInstanceToDeck(
  state: GameState,
  inst: CardInstance,
  pile: AddCardToDeckPile = 'drawPile',
): { state: GameState; events: GameEvent[] } {
  const nextState: GameState = {
    ...state,
    player: {
      ...state.player,
      deck: {
        ...state.player.deck,
        cardById: { ...state.player.deck.cardById, [inst.id]: inst },
        [pile]: [...state.player.deck[pile], inst.id],
      },
    },
  }

  if (inst.combatEphemeral) {
    return { state: nextState, events: [] }
  }

  return applyAddCardToDeckRelicTriggers(nextState, inst)
}
