import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../events'
import type { AnimJob } from '../../animation/types'
import { setPhase } from '../reduceGame'

export function deriveAnimationsFromEvents(state: GameState, events: ReadonlyArray<GameEvent>): GameState {
  if (!events.length) return state
  const jobs: AnimJob[] = []
  let serial = state.ui.anim.jobs.length

  for (const e of events) {
    if (e.type === 'EVT/COMBAT_ENDED') {
      jobs.push({
        id: `anim_${serial++}`,
        kind: 'FLOAT_TEXT',
        text: e.result === 'VICTORY' ? 'VICTORY' : 'DEFEAT',
        x: 640,
        y: 120,
        color: 'INFO',
        framesTotal: 1,
        framesLeft: 1,
        blocking: false,
      })
    }
  }

  if (!jobs.length) return state
  return { ...state, ui: { ...state.ui, anim: { ...state.ui.anim, jobs: [...state.ui.anim.jobs, ...jobs] } } }
}

export function tickAnimations(state: GameState, frames: number): GameState {
  if (!state.ui.anim.jobs.length) {
    if (state.phase === 'ANIMATING') return exitAnimatingPhase(state)
    return state
  }
  let jobs = state.ui.anim.jobs
  for (let i = 0; i < frames; i++) {
    jobs = jobs
      .map((j) => ({ ...j, framesLeft: Math.max(0, j.framesLeft - 1) }))
      .filter((j) => j.framesLeft > 0)
  }
  const s2: GameState = { ...state, ui: { ...state.ui, anim: { ...state.ui.anim, jobs } } }
  if (!jobs.length && state.phase === 'ANIMATING') return exitAnimatingPhase(s2)
  return s2
}

function exitAnimatingPhase(state: GameState): GameState {
  // Return to previous phase, defaulting to MAP if missing.
  const back = state.phasePrev ?? 'MAP'
  return setPhase(state, back)
}

// unitPos placeholder removed with damage/block animations.

