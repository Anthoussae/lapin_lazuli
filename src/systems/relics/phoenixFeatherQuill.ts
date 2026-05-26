import type { GameState } from '../../core/types/state'
import type { CardTemplate } from '../../data/cards'
import { cardHasFireTag } from '../cards/inkCost'

/** Clears the Phoenix-feather Quill discount after a fire spell is cast. */
export function consumeFreeFirstFireSpellIfFireCard(state: GameState, card: CardTemplate): GameState {
  if (!state.combat?.freeFirstFireSpell) return state
  if (!cardHasFireTag(card.tags)) return state
  return { ...state, combat: { ...state.combat, freeFirstFireSpell: false } }
}
