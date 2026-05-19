import type { GameState } from '../../core/types/state'
import { Relics } from '../../data/relics'
import { describeRelicEffect } from '../../ui/describe'
import { useRelicTravel } from '../RelicTravelContext'
import { relicImageMap } from '../assets/relicImages'
import { RelicIcon } from './RelicIcon'

export function RelicBelt(props: Readonly<{ state: GameState }>) {
  const { state } = props
  const { beltRowRef, pendingSlotRef, travelingTemplateId } = useRelicTravel()
  const pendingSlotIndex = state.player.relics.length
  const relicAlreadyOnBelt =
    travelingTemplateId != null &&
    state.player.relics.some((r) => r.templateId === travelingTemplateId)
  const pendingTemplate = travelingTemplateId && !relicAlreadyOnBelt ? travelingTemplateId : null
  const pendingRelic = pendingTemplate ? Relics[pendingTemplate] : null

  return (
    <div ref={beltRowRef} className="relicBeltRow">
      {state.player.relics.map((ri, slotIndex) => {
        const r = Relics[ri.templateId]
        return (
          <div key={ri.id} className="relicBeltSlot" data-relic-belt-slot={slotIndex}>
            <RelicIcon
              imageSrc={relicImageMap[ri.templateId]}
              fallback={r?.thumb ?? '?'}
              alt={r?.name}
              tooltipName={r?.name ?? ri.templateId}
              tooltipEffect={r ? describeRelicEffect(r) : ''}
            />
          </div>
        )
      })}
      {pendingTemplate ? (
        <div
          key="relic-belt-pending"
          ref={pendingSlotRef}
          className="relicBeltSlot relicBeltSlot--pending"
          data-relic-belt-slot={pendingSlotIndex}
          data-relic-belt-pending=""
          aria-hidden
        >
          <RelicIcon
            imageSrc={relicImageMap[pendingTemplate]}
            fallback={pendingRelic?.thumb ?? '?'}
            alt={pendingRelic?.name}
          />
        </div>
      ) : null}
    </div>
  )
}
