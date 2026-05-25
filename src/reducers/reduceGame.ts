import type { GameState, Phase } from '../core/types/state'
import type { GameAction, PlayerAction } from './actions'
import type { GameEvent } from './events'
import { eventToString } from './events'
import { applyAction } from './steps/applyAction'
import { resolveEventQueue } from './steps/resolveEvents'
import { deriveAnimationsFromEvents, tickAnimations } from './steps/animations'
import { queueInputIntent } from './steps/input'
import { pruneStaleCombatIntents } from '../systems/combat/combatInput'
import { isActionLegalNow } from './steps/phaseGating'

export function reduceGame(state: GameState, action: GameAction): GameState {
  if (action.type === 'TICK/FIXED') {
    const s2 = tickAnimations(state, action.frames)
    // When animations change, opportunistically flush queued intents.
    return flushQueuedIntents(s2)
  }

  if (action.type === 'INPUT/INTENT_ENQUEUE') {
    const s2 = queueInputIntent(state, action.action)
    return flushQueuedIntents(s2)
  }

  if (action.type === 'INPUT/INTENT_FLUSH') {
    return flushQueuedIntents(state)
  }

  return processAction(state, action)
}

function processAction(state: GameState, action: GameAction): GameState {
  const { state: s1, events: e1 } = applyAction(state, action)
  const { state: s2, events: e2 } = resolveEventQueue(s1, e1)
  const allEvents: ReadonlyArray<GameEvent> = e1.length ? e1.concat(e2) : e2
  const s3 = deriveAnimationsFromEvents(s2, allEvents)
  const s4 = stampDebugEvents(s3, allEvents)
  const s5 = enterAnimatingPhaseIfBlocking(s4)
  return pruneStaleCombatIntents(s5)
}

function flushQueuedIntents(state: GameState): GameState {
  if (!state.ui.input.queued.length) return state
  let s = state
  let queue = state.ui.input.queued
  let progressed = false

  // Deterministic: scan in-order, apply legal ones until first illegal.
  while (queue.length) {
    const next = queue[0]
    if (!isActionLegalNow(s, next)) break
    progressed = true
    queue = queue.slice(1)
    s = { ...s, ui: { ...s.ui, input: { ...s.ui.input, queued: queue } } }
    s = processAction(s, next)
  }

  if (!progressed) return state
  return { ...s, ui: { ...s.ui, input: { ...s.ui.input, queued: queue } } }
}

function stampDebugEvents(state: GameState, events: ReadonlyArray<GameEvent>): GameState {
  if (!events.length) return state
  const last = events.slice(-8).map(eventToString)
  return { ...state, ui: { ...state.ui, debug: { ...state.ui.debug, lastEvents: last } } }
}

function enterAnimatingPhaseIfBlocking(state: GameState): GameState {
  const hasBlocking = state.ui.anim.jobs.some((j) => j.blocking)
  if (!hasBlocking) return state
  if (state.phase === 'ANIMATING') return state
  return setPhase(state, 'ANIMATING')
}

export function setPhase(state: GameState, phase: Phase): GameState {
  return { ...state, phasePrev: state.phase, phase }
}

export function isPlayerAction(a: GameAction): a is PlayerAction {
  return (
    a.type === 'TITLE/NEW_GAME' ||
    a.type === 'TITLE/MAIN_MENU' ||
    a.type === 'RELIC/CHOOSE_STARTER' ||
    a.type === 'PATH/CHOOSE' ||
    a.type === 'PATH/UNLOCK_SLOT' ||
    a.type === 'MAP/START_COMBAT' ||
    a.type === 'COMBAT/SELECT_TARGET' ||
    a.type === 'COMBAT/PLAY_CARD' ||
    a.type === 'COMBAT/CANCEL_HAND_SELECTION' ||
    a.type === 'COMBAT/PICK_HAND_SELECTION_CARD' ||
    a.type === 'COMBAT/SUBMIT_HAND_SELECTION' ||
    a.type === 'COMBAT/END_TURN' ||
    a.type === 'REWARD/PICK_CARD' ||
    a.type === 'REWARD/PICK_RELIC' ||
    a.type === 'REWARD/PICK_GOLD' ||
    a.type === 'REWARD/PICK_KEYS' ||
    a.type === 'REST/SLEEP' ||
    a.type === 'REST/STUDY' ||
    a.type === 'REST/CONTINUE' ||
    a.type === 'TREASURE_ROOM/PICK_RELIC' ||
    a.type === 'SHOP/LEAVE' ||
    a.type === 'SHOP/BUY_ITEM' ||
    a.type === 'GEMSTONE_CAVERN/PROCEED' ||
    a.type === 'GEMSTONE_CAVERN/PICK_GEM' ||
    a.type === 'GEMSTONE_CAVERN/SKIP_SOCKETING' ||
    a.type === 'GEMSTONE_CAVERN/SELECT_SOCKET_CARD' ||
    a.type === 'GEMSTONE_CAVERN/CONFIRM_SOCKETING'
  )
}

