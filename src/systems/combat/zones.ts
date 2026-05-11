import type { GameState } from '../../core/types/state'
import type { CardInstanceId } from '../../core/types/ids'
import { rngInt } from '../../core/rng/rng'

export function consumeCardFromDeck(state: GameState, cardInstanceId: CardInstanceId): GameState {
  const cardById = { ...state.player.deck.cardById }
  delete cardById[cardInstanceId]
  const withoutCard = (ids: ReadonlyArray<CardInstanceId>) => ids.filter((id) => id !== cardInstanceId)

  return {
    ...state,
    player: {
      ...state.player,
      deck: {
        ...state.player.deck,
        cardById,
        drawPile: withoutCard(state.player.deck.drawPile),
        hand: withoutCard(state.player.deck.hand),
        discardPile: withoutCard(state.player.deck.discardPile),
      },
    },
  }
}

export function shuffleDiscardIntoDrawIfNeeded(state: GameState): GameState {
  const { drawPile, discardPile } = state.player.deck
  if (drawPile.length > 0 || discardPile.length === 0) return state
  // Deterministic Fisher-Yates using state RNG.
  let rng = state.rng
  const arr = [...discardPile]
  for (let i = arr.length - 1; i > 0; i--) {
    const [r2, j] = rngInt(rng, 0, i + 1)
    rng = r2
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return {
    ...state,
    rng,
    player: { ...state.player, deck: { ...state.player.deck, drawPile: arr, discardPile: [] } },
  }
}

export function shuffleDrawPile(state: GameState): GameState {
  const { drawPile } = state.player.deck
  if (drawPile.length <= 1) return state
  let rng = state.rng
  const arr = [...drawPile]
  for (let i = arr.length - 1; i > 0; i--) {
    const [r2, j] = rngInt(rng, 0, i + 1)
    rng = r2
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return { ...state, rng, player: { ...state.player, deck: { ...state.player.deck, drawPile: arr } } }
}

export function drawCards(state: GameState, count: number): GameState {
  let s = state
  for (let i = 0; i < count; i++) {
    s = shuffleDiscardIntoDrawIfNeeded(s)
    const top = s.player.deck.drawPile[0]
    if (!top) return s
    s = {
      ...s,
      player: {
        ...s.player,
        deck: {
          ...s.player.deck,
          drawPile: s.player.deck.drawPile.slice(1),
          hand: [...s.player.deck.hand, top],
        },
      },
    }
  }
  return s
}

/** How many cards to draw when refreshing the player's hand during combat. */
export function combatRefreshDrawCount(state: GameState, relicBonusDraw: number): number {
  const c = state.combat
  if (!c) return Math.max(0, state.player.baseHandSize + relicBonusDraw)
  return Math.max(0, state.player.baseHandSize + c.handDrawDelta + relicBonusDraw)
}

/** Effective max ink (energy) during combat, including boon modifiers; outside combat returns {@link GameState.player}.maxEnergy. */
export function combatEffectiveMaxEnergy(state: GameState): number {
  const c = state.combat
  const base = state.player.maxEnergy
  if (!c) return base
  return Math.max(1, base + c.maxEnergyDelta)
}

