import { CenteredPanel } from '../primitives/CenteredPanel'
import { RelicOfferRow } from '../primitives/RelicOfferRow'
import type { ScreenProps } from './types'

export function TreasureRoomScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const room = state.treasureRoom

  return (
    <CenteredPanel title="Treasure Room">
      {!room?.selectionComplete ? (
        <RelicOfferRow
          relicIds={room?.offered ?? []}
          beltSlotIndex={state.player.relics.length}
          onPick={(relicId) => enqueue({ type: 'TREASURE_ROOM/PICK_RELIC', relicId })}
        />
      ) : (
        <button type="button" className="btn" onClick={() => enqueue({ type: 'TREASURE_ROOM/PROCEED' })}>
          Proceed
        </button>
      )}
    </CenteredPanel>
  )
}
