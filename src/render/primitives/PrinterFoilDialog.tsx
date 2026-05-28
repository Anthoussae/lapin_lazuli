import { useCallback, useEffect, useRef } from 'react'
import { Cards } from '../../data/cards'
import type { CardInstanceId } from '../../core/types/ids'
import type { CardInstance } from '../../core/types/state'
import type { ScreenProps } from '../screens/types'
import { useCardSocketFlip } from '../CardSocketFlipContext'
import { cardFoilFlipPayload } from '../cardSocketFlipPayload'
import { GameCardView } from './GameCardView'
import { InspectPileCloseButton } from './InspectPileCloseButton'

function nonFoilDeckCardsSorted(instances: ReadonlyArray<CardInstance>): ReadonlyArray<CardInstance> {
  return [...instances]
    .filter((inst) => inst.foil !== true)
    .sort((a, b) => {
      const na = Cards[a.templateId]?.name ?? a.templateId
      const nb = Cards[b.templateId]?.name ?? b.templateId
      return na.localeCompare(nb)
    })
}

export function PrinterFoilDialog(
  props: Readonly<{ state: ScreenProps['state']; enqueue: ScreenProps['enqueue']; onClose: () => void }>,
) {
  const { state, enqueue, onClose } = props
  const printer = state.mysteryRoom?.printer
  const selectedId = printer?.selectedCardInstanceId ?? null
  const canFoil = selectedId != null
  const cards = nonFoilDeckCardsSorted(Object.values(state.player.deck.cardById))
  const power = state.player.power
  const firepower = state.player.firepower
  const firepowerMultiplier = state.player.firepowerMultiplier
  const shieldPower = state.player.shieldPower
  const { playCardSocketFlip, animatingCardInstanceId, isSocketFlipPlaying } = useCardSocketFlip()
  const cardSlotRefs = useRef(new Map<CardInstanceId, HTMLDivElement>())

  const tryClose = useCallback(() => {
    if (isSocketFlipPlaying) return
    onClose()
  }, [isSocketFlipPlaying, onClose])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tryClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tryClose])

  const handleFoil = () => {
    if (!canFoil || isSocketFlipPlaying || !selectedId) return
    const inst = state.player.deck.cardById[selectedId]
    const template = inst ? Cards[inst.templateId] : undefined
    const slotEl = cardSlotRefs.current.get(selectedId)
    if (!inst || !template || !slotEl) {
      enqueue({ type: 'PRINTER/FOIL' })
      return
    }
    playCardSocketFlip({
      cardInstanceId: selectedId,
      sourceEl: slotEl,
      cardBefore: cardFoilFlipPayload(template, inst, power, firepower, firepowerMultiplier, shieldPower, false),
      cardAfter: cardFoilFlipPayload(template, inst, power, firepower, firepowerMultiplier, shieldPower, true),
      onComplete: () => enqueue({ type: 'PRINTER/FOIL' }),
    })
  }

  return (
    <div
      className="printerFoilDialogOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="printerFoilTitle"
    >
      <div className="printerFoilDialogPanel">
        <InspectPileCloseButton onClose={tryClose} />
        <h2 id="printerFoilTitle" className="printerFoilDialogTitle">
          Foil card
        </h2>
        <p className="printerFoilDialogSub">Choose a card to foil (+50% to its effects).</p>
        <div className="printerFoilDialogActions">
          <button
            type="button"
            className="printerFoilDialogSubmit"
            disabled={!canFoil || isSocketFlipPlaying}
            onClick={handleFoil}
          >
            Foil
          </button>
        </div>
        <div className="printerFoilDialogHand">
          {cards.map((inst) => {
            const t = Cards[inst.templateId]
            const selected = selectedId === inst.id
            const animating = animatingCardInstanceId === inst.id
            return (
              <div
                key={inst.id}
                ref={(el) => {
                  if (el) cardSlotRefs.current.set(inst.id, el)
                  else cardSlotRefs.current.delete(inst.id)
                }}
                className={[
                  'printerFoilDialogCardSlot',
                  animating ? 'printerFoilDialogCardSlot--animating' : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-printer-card-instance-id={inst.id}
              >
                <GameCardView
                  inst={inst}
                  template={t}
                  power={power}
                  firepower={firepower}
                  firepowerMultiplier={firepowerMultiplier}
                  shieldPower={shieldPower}
                  hasGreenHat={state.player.relics.some((r) => r.templateId === 'GREEN_HAT')}
                  selected={selected}
                  className="printerFoilDialogCard"
                  onClick={
                    isSocketFlipPlaying
                      ? undefined
                      : () => enqueue({ type: 'PRINTER/SELECT_CARD', cardInstanceId: inst.id })
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
