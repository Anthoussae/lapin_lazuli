import type { PlayerAction } from '../reducers/actions'

export type InputState = Readonly<{
  queued: ReadonlyArray<PlayerAction>
}>

export function inputInitial(): InputState {
  return { queued: [] }
}

