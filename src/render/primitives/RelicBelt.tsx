import type { RelicId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { Relics, type RelicTemplate } from '../../data/relics'
import { describeRelicEffect } from '../../ui/describe'
import { useRelicTravel } from '../RelicTravelContext'
import { useTriggerFxArtProps } from '../TriggerFxContext'
import { longbeltSprite } from '../assets/displayImages'
import { relicImageMap } from '../assets/relicImages'
import { RelicIcon } from './RelicIcon'

function RelicBeltSlot(
  props: Readonly<{
    slotIndex: number
    templateId: RelicId
    relic: RelicTemplate | undefined
    state: GameState
  }>,
) {
  const { slotIndex, templateId, relic, state } = props
  const triggerFx = useTriggerFxArtProps({ kind: 'relic', slotIndex })
  const render = relic?.render
  const counter =
    render?.kind === 'RelicCounter' && render.value === 'cardsPlayedThisTurn'
      ? {
          value: state.combat?.cardsPlayedThisTurn ?? 0,
          offsetX: render.offset.x,
          offsetY: render.offset.y,
          fontSize: render.fontSize,
          color: render.color,
        }
      : undefined
  return (
    <div className="relicBeltSlot" data-relic-belt-slot={slotIndex}>
      <RelicIcon
        imageSrc={relicImageMap[templateId]}
        fallback={relic?.thumb ?? '?'}
        alt={relic?.name}
        tooltipName={relic?.name ?? templateId}
        tooltipEffect={relic ? describeRelicEffect(relic) : ''}
        artClassName={triggerFx.className}
        artKey={triggerFx.key}
        counter={counter}
      />
    </div>
  )
}

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
    <div className="relicBelt">
      <img className="relicBelt__bg" src={longbeltSprite} alt="" draggable={false} />
      <div ref={beltRowRef} className="relicBeltRow">
      {state.player.relics.map((ri, slotIndex) => {
        const r = Relics[ri.templateId]
        return (
          <RelicBeltSlot
            key={ri.id}
            slotIndex={slotIndex}
            templateId={ri.templateId}
            relic={r}
            state={state}
          />
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
    </div>
  )
}
