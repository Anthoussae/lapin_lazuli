import type { GameState } from '../../core/types/state'
import { pathRoomDisplay, pathShowsInformationDisplay, resolveActiveRoomPathId } from '../../data/paths'

export function RoomInfoHud(props: Readonly<{ state: GameState }>) {
  const pathId = resolveActiveRoomPathId(props.state)
  if (!pathShowsInformationDisplay(pathId)) return null

  const { name, roomDescription } = pathRoomDisplay(pathId)

  return (
    <div className="roomInfoHud" aria-label="Current room">
      <div className="roomInfoHud__name hudText">{name}</div>
      <div className="roomInfoHud__description hudText">{roomDescription}</div>
    </div>
  )
}
