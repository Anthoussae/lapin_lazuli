import type { CardId, CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { shuffleDrawPile } from '../combat/zones'
import { addCardInstanceToDeck } from './addCardToDeck'
import { createCardInstance } from '../../data/cards'

/** Create one card instance, add it to the draw pile, and shuffle the pile. */
export function shuffleBurdenIntoDeck(state: GameState, templateId: CardId): GameState {
  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = createCardInstance(newId, templateId)
  const added = addCardInstanceToDeck(
    { ...state, player: { ...state.player, nextCardInstanceSerial: serial + 1 } },
    inst,
  )
  return shuffleDrawPile(added.state)
}
