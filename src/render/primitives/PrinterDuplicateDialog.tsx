import { useCallback, useEffect, useRef } from 'react'
import { Cards } from '../../data/cards'
import type { CardInstanceId } from '../../core/types/ids'
import type { CardInstance } from '../../core/types/state'
import { cardInstanceInkCost } from '../../systems/cards/inkCost'
import type { ScreenProps } from '../screens/types'
import { useCardTravel } from '../CardTravelContext'
import { powerDisplayContextFromPlayer } from '../../systems/combat/powerDisplay'
import { cardTravelPayloadForInstance } from '../cardSocketFlipPayload'
import { GameCardView } from './GameCardView'
import { InspectPileCloseButton } from './InspectPileCloseButton'

function deckCardsSorted(instances: ReadonlyArray<CardInstance>): ReadonlyArray<CardInstance> {
  return [...instances].sort((a, b) => {
    const na = Cards[a.templateId]?.name ?? a.templateId
    const nb = Cards[b.templateId]?.name ?? b.templateId
    return na.localeCompare(nb)
  })
}

export function PrinterDuplicateDialog(
  props: Readonly<{ state: ScreenProps['state']; enqueue: ScreenProps['enqueue']; onClose: () => void }>,
) {
  const { state, enqueue, onClose } = props
  const printer = state.mysteryRoom?.printer
  const selectedId = printer?.duplicateSelectedCardInstanceId ?? null
  const canDuplicate = selectedId != null
  const cards = deckCardsSorted(Object.values(state.player.deck.cardById))
  const powerDisplay = powerDisplayContextFromPlayer(state.player)
  const { travelCardToDeck, travelingCardKey } = useCardTravel()
  const cardSlotRefs = useRef(new Map<CardInstanceId, HTMLDivElement>())
  const traveling = travelingCardKey != null

  const tryClose = useCallback(() => {
    if (traveling) return
    onClose()
  }, [traveling, onClose])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tryClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tryClose])

  const handleDuplicate = () => {
    if (!canDuplicate || traveling || !selectedId) return
    const inst = state.player.deck.cardById[selectedId]
    const template = inst ? Cards[inst.templateId] : undefined
    const slotEl = cardSlotRefs.current.get(selectedId)
    if (!inst || !template || !slotEl) {
      enqueue({ type: 'PRINTER/DUPLICATE' })
      onClose()
      return
    }
    const ink = cardInstanceInkCost(inst, template)
    const inkLabel = inst.exhausted ? 'Exhausted' : ink !== null ? String(ink) : null
    travelCardToDeck({
      cardKey: `printer-duplicate-${selectedId}`,
      sourceEl: slotEl,
      card: {
        ...cardTravelPayloadForInstance(template, inst, powerDisplay, state.level),
        inkLabel,
      },
      onComplete: () => {
        enqueue({ type: 'PRINTER/DUPLICATE' })
        onClose()
      },
    })
  }

  return (
    <div
      className="printerDuplicateDialogOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="printerDuplicateTitle"
    >
      <div className="printerDuplicateDialogPanel">
        <InspectPileCloseButton onClose={tryClose} />
        <h2 id="printerDuplicateTitle" className="printerDuplicateDialogTitle">
          Duplicate card
        </h2>
        <p className="printerDuplicateDialogSub">Choose a card to add a copy to your deck.</p>
        <div className="printerDuplicateDialogActions">
          <button
            type="button"
            className="printerDuplicateDialogSubmit"
            disabled={!canDuplicate || traveling}
            onClick={handleDuplicate}
          >
            Duplicate
          </button>
        </div>
        <div className="printerDuplicateDialogHand">
          {cards.map((inst) => {
            const t = Cards[inst.templateId]
            const selected = selectedId === inst.id
            const isTraveling = travelingCardKey === `printer-duplicate-${inst.id}`
            return (
              <div
                key={inst.id}
                ref={(el) => {
                  if (el) cardSlotRefs.current.set(inst.id, el)
                  else cardSlotRefs.current.delete(inst.id)
                }}
                className={[
                  'printerDuplicateDialogCardSlot gameCardHoverHost',
                  isTraveling ? 'printerDuplicateDialogCardSlot--animating' : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-printer-duplicate-card-instance-id={inst.id}
              >
                <GameCardView
                  inst={inst}
                  template={t}
                  powerDisplay={powerDisplay}
                  gameLevel={state.level}
                  selected={selected}
                  className="printerDuplicateDialogCard"
                  onClick={
                    traveling
                      ? undefined
                      : () =>
                          enqueue({
                            type: 'PRINTER/SELECT_DUPLICATE_CARD',
                            cardInstanceId: inst.id,
                          })
                  }
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
