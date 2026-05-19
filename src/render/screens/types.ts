import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../../reducers/actions'

export type ScreenProps = Readonly<{
  state: GameState
  enqueue: (action: PlayerAction) => void
}>
