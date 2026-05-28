import type { CardId, EnemyInstanceId } from '../../core/types/ids'
import type { BurdenAddEntry, CombatState, GameState } from '../../core/types/state'
import { shuffleBurdenIntoDeck } from '../cards/shuffleBurdenIntoDeck'
import { shuffleBurdenIntoDiscard } from '../cards/shuffleBurdenIntoDiscard'
import { combatRefreshDrawCount, drawCards } from './zones'
import type { GameEvent } from '../../reducers/events'

export function hasPendingBurdenAdds(state: GameState): boolean {
  return (state.combat?.burdenAddQueue.length ?? 0) > 0
}

function enqueueBurdenAdd(state: GameState, entry: Omit<BurdenAddEntry, 'id'>): GameState {
  const combat = state.combat
  if (!combat) return state
  const id = `b${combat.nextBurdenAddSerial}`
  return {
    ...state,
    combat: {
      ...combat,
      burdenAddQueue: [...combat.burdenAddQueue, { ...entry, id }],
      nextBurdenAddSerial: combat.nextBurdenAddSerial + 1,
    },
  }
}

export function enqueueBurdenAdds(
  state: GameState,
  cardId: CardId,
  count: number,
  zone: BurdenAddEntry['zone'],
  sourceEnemyId: EnemyInstanceId | null,
): GameState {
  let s = state
  for (let i = 0; i < count; i++) {
    s = enqueueBurdenAdd(s, { cardId, upgrades: 0, zone, sourceEnemyId })
  }
  return s
}

function applyBurdenEntry(state: GameState, entry: BurdenAddEntry): GameState {
  if (entry.zone === 'discard') return shuffleBurdenIntoDiscard(state, entry.cardId)
  return shuffleBurdenIntoDeck(state, entry.cardId)
}

function completePendingOpeningHandDraw(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  const pending = combat?.pendingOpeningHandDraw
  if (!combat || !pending) return { state, events: [] }

  const openingDraw = drawCards(state, combatRefreshDrawCount(state, pending.bonusDraw), { openingHand: true })
  return {
    state: {
      ...openingDraw.state,
      combat: { ...combat, pendingOpeningHandDraw: null },
    },
    events: openingDraw.events,
  }
}

/** Apply the front of {@link CombatState.burdenAddQueue} after its travel FX completes. */
export function completeBurdenAdd(state: GameState, id?: string): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat?.burdenAddQueue.length) return { state, events: [] }

  const idx = id ? combat.burdenAddQueue.findIndex((e) => e.id === id) : 0
  if (idx < 0) return { state, events: [] }
  const entry = combat.burdenAddQueue[idx]!
  const rest = combat.burdenAddQueue.filter((_, i) => i !== idx)
  let s = applyBurdenEntry(state, entry)
  s = {
    ...s,
    combat: { ...combat, burdenAddQueue: rest },
  }

  if (rest.length > 0) return { state: s, events: [] }

  if (s.combat?.pendingOpeningHandDraw) {
    return completePendingOpeningHandDraw(s)
  }

  return { state: s, events: [] }
}
