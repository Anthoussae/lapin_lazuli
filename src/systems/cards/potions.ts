import type { CardId } from '../../core/types/ids'
import type { CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import type { RngState } from '../../core/rng/rng'
import { rngInt } from '../../core/rng/rng'
import { allPotionCardIds, Cards, createCardInstance } from '../../data/cards'

/** Weighted roll among potion templates (uses {@link Cards}[id].poolFrequency}). */
export function rollRandomPotionId(rng: RngState): { rng: RngState; cardId: CardId } {
  const pool = allPotionCardIds()
  const total = pool.reduce((acc, id) => acc + Math.max(0, Cards[id]?.poolFrequency ?? 0), 0)
  if (!pool.length || total <= 0) {
    return { rng, cardId: pool[0] ?? 'HEALTH_POTION' }
  }

  const [r2, n] = rngInt(rng, 0, total)
  let cursor = 0
  let chosen: CardId = pool[0]!
  for (const id of pool) {
    cursor += Math.max(0, Cards[id]?.poolFrequency ?? 0)
    if (n < cursor) {
      chosen = id
      break
    }
  }
  return { rng: r2, cardId: chosen }
}

/** Combat-only potion in hand (un-upgraded, Expire, removed from the run deck after combat). */
export function addRandomPotionToHand(state: GameState): GameState {
  if (!state.combat) return state

  const rolled = rollRandomPotionId(state.rng)
  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = createCardInstance(newId, rolled.cardId, 0, false, {
    grantedExpire: true,
    combatEphemeral: true,
  })

  return {
    ...state,
    rng: rolled.rng,
    player: {
      ...state.player,
      nextCardInstanceSerial: serial + 1,
      deck: {
        ...state.player.deck,
        cardById: { ...state.player.deck.cardById, [inst.id]: inst },
        hand: [...state.player.deck.hand, inst.id],
      },
    },
  }
}
