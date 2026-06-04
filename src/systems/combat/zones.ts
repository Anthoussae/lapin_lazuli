import type { GameState } from '../../core/types/state'
import { combatHandDrawPenaltyFromEnchantments } from '../enchantments/staticEffects'
import type { CardInstanceId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'
import { rngInt } from '../../core/rng/rng'
import { applyNonOpenerCardDrawRelicTriggers } from '../relics/triggers'

export const MAX_HAND_SIZE = 10

export type DrawCardsOpts = Readonly<{
  /** Combat opening hand at startCombat; skips onNonOpenerCardDraw relic triggers. */
  openingHand?: boolean
}>

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

export function drawCards(
  state: GameState,
  count: number,
  opts?: DrawCardsOpts,
): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (let i = 0; i < count; i++) {
    if (s.player.deck.hand.length >= MAX_HAND_SIZE) break
    s = shuffleDiscardIntoDrawIfNeeded(s)
    const top = s.player.deck.drawPile[0]
    if (!top) return { state: s, events }
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
    if (!opts?.openingHand) {
      const triggered = applyNonOpenerCardDrawRelicTriggers(s)
      s = triggered.state
      events.push(...triggered.events)
    }
  }
  return { state: s, events }
}

/** How many cards to draw when refreshing the player's hand during combat. */
export function combatRefreshDrawCount(state: GameState, relicBonusDraw: number): number {
  const c = state.combat
  if (!c) return Math.max(0, state.player.baseHandSize + relicBonusDraw)
  const drawCount =
    state.player.baseHandSize + c.handDrawDelta + relicBonusDraw - combatHandDrawPenaltyFromEnchantments(state)
  return Math.max(1, drawCount)
}

/** Effective max ink (energy) during combat, including boon modifiers; outside combat returns {@link GameState.player}.maxEnergy. */
export function combatEffectiveMaxEnergy(state: GameState): number {
  const c = state.combat
  const base = state.player.maxEnergy
  if (!c) return base
  return Math.max(1, base + c.maxEnergyDelta)
}

