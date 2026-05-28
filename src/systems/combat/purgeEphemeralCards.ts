import type { CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'

/** Removes combat-only card instances (e.g. Copper Alembics potions) before merging zones into the run deck. */
export function purgeCombatEphemeralCards(state: GameState): GameState {
  const ephemeral = new Set<CardInstanceId>()
  for (const inst of Object.values(state.player.deck.cardById)) {
    if (inst?.combatEphemeral) ephemeral.add(inst.id)
  }
  if (ephemeral.size === 0) return state

  const without = (ids: ReadonlyArray<CardInstanceId>) => ids.filter((id) => !ephemeral.has(id))
  const cardById = { ...state.player.deck.cardById }
  for (const id of ephemeral) delete cardById[id]

  return {
    ...state,
    player: {
      ...state.player,
      deck: {
        ...state.player.deck,
        cardById,
        drawPile: without(state.player.deck.drawPile),
        hand: without(state.player.deck.hand),
        discardPile: without(state.player.deck.discardPile),
      },
    },
  }
}
