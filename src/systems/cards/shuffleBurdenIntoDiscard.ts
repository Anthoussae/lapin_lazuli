import type { CardId, CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { addCardInstanceToDeck } from './addCardToDeck'
import { createCardInstance } from '../../data/cards'

/** Create one card instance and add it to the discard pile. */
export function shuffleBurdenIntoDiscard(state: GameState, templateId: CardId): GameState {
  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = createCardInstance(newId, templateId)
  const added = addCardInstanceToDeck(
    { ...state, player: { ...state.player, nextCardInstanceSerial: serial + 1 } },
    inst,
    'discardPile',
  )
  return added.state
}
