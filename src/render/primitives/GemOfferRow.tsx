import { useMemo } from 'react'
import type { GemId } from '../../core/types/ids'
import { Gems } from '../../data/gems'
import { describeGemEffect } from '../../ui/describe'
import { blackCarpet } from '../assets/displayImages'
import { gemImageMap } from '../assets/gemImages'
import { GemIcon } from './GemIcon'

export function GemOfferRow(
  props: Readonly<{
    gemIds: ReadonlyArray<GemId>
    onPick: (id: GemId) => void
  }>,
) {
  const { gemIds, onPick } = props
  const offerKey = gemIds.join(',')
  const rotationByIndex = useMemo(
    () => gemIds.map(() => Math.random() * 360),
    [offerKey],
  )

  return (
    <div className="gemOffer">
      <img className="gemOffer__carpet" src={blackCarpet} alt="" draggable={false} />
      <div className="gemOfferRow">
        {gemIds.map((id, index) => {
          const gem = Gems[id]
          return (
            <div key={id} className="gemOfferSlot">
              <GemIcon
                imageSrc={gemImageMap[id]}
                fallback={gem?.name?.slice(0, 1) ?? '?'}
                alt={gem?.name}
                tooltipName={gem?.name ?? id}
                tooltipEffect={gem ? describeGemEffect(gem) : ''}
                rotationDeg={rotationByIndex[index]}
                onClick={() => onPick(id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
