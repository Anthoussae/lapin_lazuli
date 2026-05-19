import type { RelicId } from '../../core/types/ids'
import { Relics } from '../../data/relics'
import { describeRelicEffect } from '../../ui/describe'
import { useRelicTravel } from '../RelicTravelContext'
import { relicImageMap } from '../assets/relicImages'
import { RelicIcon } from './RelicIcon'
import { RelicRejectPuffs } from './RelicRejectPuffs'

export function RelicOfferRow(
  props: Readonly<{
    relicIds: ReadonlyArray<RelicId>
    beltSlotIndex: number
    onPick: (id: RelicId) => void
  }>,
) {
  const { relicIds, beltSlotIndex, onPick } = props
  const { travelRelicToBelt, travelingTemplateId } = useRelicTravel()
  const traveling = travelingTemplateId != null

  return (
    <div className="relicOfferRow">
      {relicIds.map((id) => {
        const r = Relics[id]
        const isChosen = travelingTemplateId === id
        const isRejected = traveling && !isChosen
        return (
          <div key={id} className="relicOfferSlot">
            {isRejected ? <RelicRejectPuffs /> : null}
            <RelicIcon
              imageSrc={relicImageMap[id]}
              fallback={r?.thumb ?? '?'}
              alt={r?.name}
              tooltipName={r?.name ?? id}
              tooltipEffect={r ? describeRelicEffect(r) : ''}
              traveling={isChosen}
              disabled={traveling}
              className={isRejected ? 'relicIcon--rejected' : undefined}
              onClick={(e) => {
                if (traveling) return
                travelRelicToBelt({
                  templateId: id,
                  sourceEl: e.currentTarget,
                  beltSlotIndex,
                  onComplete: () => onPick(id),
                })
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
