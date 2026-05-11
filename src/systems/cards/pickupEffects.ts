import type { GameState } from '../../core/types/state'
import type { CardId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { applyRelicEffect } from '../relics/applyRelicEffects'

/** Runs optional `pickupEffects` on a card template when that card is acquired outside combat. */
export function applyCardPickupEffects(state: GameState, cardId: CardId): GameState {
  const tmpl = Cards[cardId]
  const fxs = tmpl.pickupEffects ?? []
  let s = state
  for (const fx of fxs) {
    s = applyRelicEffect(s, fx)
  }
  return s
}
