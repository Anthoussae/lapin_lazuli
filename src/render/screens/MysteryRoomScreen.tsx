import { darkPurpleBackdrop } from '../assets/backdropImages'
import { mysteryRoomDisplay, mysteryRoomIsEvent } from '../../data/mysteryRooms'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { CollectorScreen } from './CollectorScreen'
import { FontOfLetheScreen } from './FontOfLetheScreen'
import { PrinterScreen } from './PrinterScreen'
import type { ScreenProps } from './types'

export function MysteryRoomScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const roomId = state.mysteryRoom?.roomId
  if (!roomId || !mysteryRoomIsEvent(roomId)) return null

  if (roomId === 'FONT_OF_LETHE') {
    return <FontOfLetheScreen {...props} />
  }

  if (roomId === 'COLLECTOR') {
    return <CollectorScreen {...props} />
  }

  if (roomId === 'PRINTER') {
    return <PrinterScreen {...props} />
  }

  const { name } = mysteryRoomDisplay(roomId)

  return (
    <>
      <div className="screenBackdrop screenBackdrop--mysteryRoom" aria-hidden>
        <img className="screenBackdrop__img" src={darkPurpleBackdrop} alt="" draggable={false} />
      </div>
      <CenteredPanel panelClassName="mysteryRoomPanel">
        <h1 className="mysteryRoomPanel__title hudText">{name}</h1>
        <button type="button" className="btn mysteryRoomProceedBtn" onClick={() => enqueue({ type: 'EVENT/PROCEED' })}>
          Proceed
        </button>
      </CenteredPanel>
    </>
  )
}
