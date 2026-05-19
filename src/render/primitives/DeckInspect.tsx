import { useEffect, useState } from 'react'
import type { GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import { useCardTravelOptional } from '../CardTravelContext'
import { deckInspectSprite, discardInspectSprite } from '../assets/displayImages'
import { GameCardView } from './GameCardView'
import { InspectPileCardSlot } from './InspectPileCardSlot'
import { OpaqueImageButton } from './OpaqueImageButton'

export function DeckInspect(props: Readonly<{ state: GameState; inCombat: boolean }>) {
  const { state, inCombat } = props
  const [deckOpen, setDeckOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const power = state.player.power
  const firepowerMultiplier = state.player.firepowerMultiplier

  useEffect(() => {
    if (!deckOpen && !discardOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeckOpen(false)
        setDiscardOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deckOpen, discardOpen])

  const deckPileCount = state.player.deck.drawPile.length
  const discardPileCount = state.player.deck.discardPile.length
  const cardTravel = useCardTravelOptional()

  return (
    <>
      {inCombat ? (
        <OpaqueImageButton
          className="inspectDiscardBtn"
          imageClassName="inspectDiscardBtn__img"
          src={discardInspectSprite}
          alt="Inspect discard pile"
          hoverOverlay={discardPileCount}
          onClick={() => setDiscardOpen((v) => !v)}
        />
      ) : null}
      <OpaqueImageButton
        className="inspectDeckBtn"
        imageClassName="inspectDeckBtn__img"
        imageRef={cardTravel?.deckInspectImageRef}
        src={deckInspectSprite}
        alt="Inspect deck"
        hoverOverlay={deckPileCount}
        onClick={() => setDeckOpen((v) => !v)}
      />

      {(deckOpen || discardOpen) && (
        <div className="inspectDeckOverlay">
          <div className="inspectDeckPanel">
            <button
              className="inspectDeckClose"
              onClick={() => {
                setDeckOpen(false)
                setDiscardOpen(false)
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="inspectDeckTitle">{discardOpen ? 'Discard pile' : `Deck (${deckPileCount})`}</div>
            <div className="inspectDeckList inspectDeckList--cards">
              {state.combat ? (
                <>
                  {(discardOpen ? state.player.deck.discardPile : state.player.deck.drawPile).map((cid, idx) => {
                    const inst = state.player.deck.cardById[cid]
                    const t = inst ? Cards[inst.templateId] : undefined
                    return (
                      <InspectPileCardSlot key={`pile-${idx}-${cid}`}>
                        <GameCardView
                          cardInstanceId={cid}
                          inst={inst}
                          template={t}
                          power={power}
                          firepowerMultiplier={firepowerMultiplier}
                        />
                      </InspectPileCardSlot>
                    )
                  })}
                </>
              ) : (
                Object.values(state.player.deck.cardById).map((inst) => {
                  const t = Cards[inst.templateId]
                  return (
                    <InspectPileCardSlot key={inst.id}>
                      <GameCardView
                        inst={inst}
                        template={t}
                        power={power}
                        firepowerMultiplier={firepowerMultiplier}
                      />
                    </InspectPileCardSlot>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
