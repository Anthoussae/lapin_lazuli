import { greenCarpet } from '../assets/displayImages'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RelicOfferRow } from '../primitives/RelicOfferRow'
import type { ScreenProps } from './types'

export function TreasureRoomScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const room = state.treasureRoom

  return (
    <CenteredPanel>
      <div className="treasureRoomOffer">
        <img className="treasureRoomOffer__carpet" src={greenCarpet} alt="" draggable={false} />
        <RelicOfferRow
          relicIds={room?.offered ?? []}
          beltSlotIndex={state.player.relics.length}
          onPick={(relicId) => enqueue({ type: 'TREASURE_ROOM/PICK_RELIC', relicId })}
        />
      </div>
    </CenteredPanel>
  )
}
