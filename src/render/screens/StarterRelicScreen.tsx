import { plainCrimsonBackdrop } from '../assets/backdropImages'
import { mythicCarpet } from '../assets/displayImages'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RelicOfferRow } from '../primitives/RelicOfferRow'
import type { ScreenProps } from './types'

export function StarterRelicScreen(props: ScreenProps) {
  const { state, enqueue } = props

  return (
    <>
      <div className="screenBackdrop screenBackdrop--starterRelic" aria-hidden>
        <img className="screenBackdrop__img" src={plainCrimsonBackdrop} alt="" draggable={false} />
      </div>
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
    </>
  )
}
