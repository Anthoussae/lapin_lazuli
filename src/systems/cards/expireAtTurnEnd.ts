import type { GameState } from '../../core/types/state'
import { consumeCardFromDeck } from '../combat/zones'
import { cardInstanceExpiresAtTurnEnd } from './cardEffects'

/** Removes Expire cards from hand (same rule as end of player turn). */
export function consumeExpireCardsInHand(state: GameState): GameState {
  let s = state
  for (const cardInstanceId of [...s.player.deck.hand]) {
    const inst = s.player.deck.cardById[cardInstanceId]
    if (!inst || !cardInstanceExpiresAtTurnEnd(inst)) continue
    s = consumeCardFromDeck(s, cardInstanceId)
  }
  return s
}
