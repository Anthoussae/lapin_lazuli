import { useEffect } from 'react'
import { mythicCarpet } from '../assets/displayImages'
import { PATH_DOOR_PRELOAD_URLS } from '../assets/doorImages'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RelicOfferRow } from '../primitives/RelicOfferRow'
import type { ScreenProps } from './types'

export function StarterRelicScreen(props: ScreenProps) {
  const { state, enqueue } = props

  useEffect(() => {
    for (const url of PATH_DOOR_PRELOAD_URLS) {
      const img = new Image()
      img.src = url
    }
  }, [])

  return (
    <CenteredPanel title="Choose a relic:" panelClassName="starterRelicPanel">
      <div className="starterRelicOffer">
        <img className="starterRelicOffer__carpet" src={mythicCarpet} alt="" draggable={false} />
        <RelicOfferRow
          relicIds={state.relicSelection?.offered ?? []}
          beltSlotIndex={state.player.relics.length}
          onPick={(relicId) => enqueue({ type: 'RELIC/CHOOSE_STARTER', relicId })}
        />
      </div>
    </CenteredPanel>
  )
}
