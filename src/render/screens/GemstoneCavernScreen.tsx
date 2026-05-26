import { useRef } from 'react'
import { darkPurpleBackdrop } from '../assets/backdropImages'
import { Cards } from '../../data/cards'
import { Gems } from '../../data/gems'
import { socketableDeckCards } from '../../systems/gems/socketing'
import { useCardSocketFlip } from '../CardSocketFlipContext'
import { cardSocketFlipPayload } from '../cardSocketFlipPayload'
import { GameCardView } from '../primitives/GameCardView'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { GemOfferRow } from '../primitives/GemOfferRow'
import { GemSocketPedestal } from '../primitives/GemSocketPedestal'
import type { ScreenProps } from './types'

export function GemstoneCavernScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const cavern = state.gemstoneCavern
  const { playCardSocketFlip, animatingCardInstanceId, isSocketFlipPlaying } = useCardSocketFlip()
  const cardSlotRefs = useRef(new Map<string, HTMLDivElement>())

  const backdrop = (
    <div className="screenBackdrop screenBackdrop--gemstoneCavern" aria-hidden>
      <img className="screenBackdrop__img" src={darkPurpleBackdrop} alt="" draggable={false} />
    </div>
  )

  if (cavern?.socketing) {
    const gemId = cavern.socketing.gemId
    const gem = Gems[gemId]
    const selectedId = cavern.socketing.selectedCardInstanceId
    const canSocket = selectedId != null && !isSocketFlipPlaying
    return (
      <>
        {backdrop}
        <CenteredPanel panelClassName="gemstoneSocketPanel">
        <GemSocketPedestal gemId={gemId} gem={gem} />
        <div className="gemstoneSocketActions">
          <button
            type="button"
            className="btn gemstoneSocketBackBtn"
            disabled={isSocketFlipPlaying}
            onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/SKIP_SOCKETING' })}
          >
            Back
          </button>
          <button
            type="button"
            className="btn gemstoneSocketSocketBtn"
            disabled={!canSocket}
            onClick={() => {
              if (!selectedId) return
              const inst = state.player.deck.cardById[selectedId]
              const template = inst ? Cards[inst.templateId] : undefined
              const slotEl = cardSlotRefs.current.get(selectedId)
              if (!inst || !template || !slotEl) {
                enqueue({ type: 'GEMSTONE_CAVERN/CONFIRM_SOCKETING' })
                return
              }
              const power = state.player.power
              const firepowerMultiplier = state.player.firepowerMultiplier
              const shieldPower = state.player.shieldPower
              playCardSocketFlip({
                cardInstanceId: selectedId,
                sourceEl: slotEl,
                cardBefore: cardSocketFlipPayload(template, inst, power, firepowerMultiplier, shieldPower, null),
                cardAfter: cardSocketFlipPayload(template, inst, power, firepowerMultiplier, shieldPower, gemId),
                onComplete: () => enqueue({ type: 'GEMSTONE_CAVERN/CONFIRM_SOCKETING' }),
              })
            }}
          >
            Socket
          </button>
        </div>
        <div className="gemstoneSocketCardPanel">
          <div className="gemstoneSocketCardList">
            {socketableDeckCards(state).map((inst) => {
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
                  className={animating ? 'gemstoneSocketCardSlot gemstoneSocketCardSlot--animating' : 'gemstoneSocketCardSlot'}
                >
                  <GameCardView
                    inst={inst}
                    template={t}
                    power={state.player.power}
                    firepowerMultiplier={state.player.firepowerMultiplier}
                    shieldPower={state.player.shieldPower}
                    selected={selected}
                    className="gemstoneSocketCard"
                    onClick={
                      isSocketFlipPlaying
                        ? undefined
                        : () => enqueue({ type: 'GEMSTONE_CAVERN/SELECT_SOCKET_CARD', cardInstanceId: inst.id })
                    }
                  />
                </div>
              )
            })}
          </div>
        </div>
        </CenteredPanel>
      </>
    )
  }

  return (
    <>
      {backdrop}
      <CenteredPanel panelClassName="jewellersPanel">
      <GemOfferRow
        gemIds={cavern?.offered ?? []}
        onPick={(gemId) => enqueue({ type: 'GEMSTONE_CAVERN/PICK_GEM', gemId })}
      />
      <button
        type="button"
        className="btn jewellersProceedBtn"
        onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/PROCEED' })}
      >
        Proceed
      </button>
      </CenteredPanel>
    </>
  )
}
