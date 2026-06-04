import type { CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { combatStartDisableBestCardCount } from '../../data/enemyBoons'
import { determineBestCard, playerOwnedCardInstances } from '../cards/determineBestCard'

/** Disables the player's best deck cards at combat start (Disabling boon). */
export function applyCombatStartDisableBestCards(state: GameState): GameState {
  const combat = state.combat
  if (!combat) return state

  const count = combatStartDisableBestCardCount(Object.values(combat.enemies.enemyById))
  if (count <= 0) return state

  let s = state
  let rng = s.rng
  const disabledIds = new Set<CardInstanceId>()

  for (let i = 0; i < count; i++) {
    const [rng2, best] = determineBestCard(rng, playerOwnedCardInstances(s), disabledIds)
    rng = rng2
    if (!best) break

    disabledIds.add(best.id)
    const current = s.player.deck.cardById[best.id] ?? best
    s = {
      ...s,
      rng,
      player: {
        ...s.player,
        deck: {
          ...s.player.deck,
          cardById: {
            ...s.player.deck.cardById,
            [best.id]: { ...current, disabled: true },
          },
        },
      },
    }
  }

  return { ...s, rng }
}
