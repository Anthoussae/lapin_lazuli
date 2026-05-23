import { useCallback, useEffect, useState, type AnimationEvent } from 'react'
import type { GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import { useCardTravelOptional } from '../CardTravelContext'
import { deckInspectSprite, discardInspectSprite } from '../assets/displayImages'
import { GameCardView } from './GameCardView'
import { InspectPileCardSlot } from './InspectPileCardSlot'
import { InspectPileCloseButton } from './InspectPileCloseButton'
import { OpaqueImageButton } from './OpaqueImageButton'

export function DeckInspect(props: Readonly<{ state: GameState; inCombat: boolean }>) {
  const { state, inCombat } = props
  const [deckOpen, setDeckOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const pileOpen = deckOpen || discardOpen
  const [overlayMounted, setOverlayMounted] = useState(false)
  const [overlayExiting, setOverlayExiting] = useState(false)
  const power = state.player.power
  const firepowerMultiplier = state.player.firepowerMultiplier

  useEffect(() => {
    if (pileOpen) {
      setOverlayMounted(true)
      setOverlayExiting(false)
    } else if (overlayMounted) {
      setOverlayExiting(true)
    }
  }, [pileOpen, overlayMounted])

  useEffect(() => {
    if (!pileOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeckOpen(false)
        setDiscardOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pileOpen])

  const deckPileCount = state.player.deck.drawPile.length
  const discardPileCount = state.player.deck.discardPile.length
  const cardTravel = useCardTravelOptional()

  const closeInspectPanel = useCallback(() => {
    setDeckOpen(false)
    setDiscardOpen(false)
  }, [])

  const onOverlayAnimationEnd = useCallback((e: AnimationEvent<HTMLDivElement>) => {
    if (!overlayExiting || e.target !== e.currentTarget) return
    if (e.animationName !== 'inspectPileOverlayCollapse') return
    setOverlayMounted(false)
    setOverlayExiting(false)
  }, [overlayExiting])

  return (
    <>
      {inCombat ? (
        <OpaqueImageButton
          className={discardOpen ? 'inspectDiscardBtn inspectDiscardBtn--panelOpen' : 'inspectDiscardBtn'}
          imageClassName="inspectDiscardBtn__img"
          imageRef={cardTravel?.discardInspectImageRef}
          src={discardInspectSprite}
          alt="Inspect discard pile"
          hoverOverlay={discardPileCount}
          onClick={() => setDiscardOpen((v) => !v)}
        />
      ) : null}
      <OpaqueImageButton
        className={deckOpen ? 'inspectDeckBtn inspectDeckBtn--panelOpen' : 'inspectDeckBtn'}
        imageClassName="inspectDeckBtn__img"
        imageRef={cardTravel?.deckInspectImageRef}
        src={deckInspectSprite}
        alt="Inspect deck"
        hoverOverlay={deckPileCount}
        onClick={() => setDeckOpen((v) => !v)}
      />

      {overlayMounted && (
        <div
          className={overlayExiting ? 'inspectDeckOverlay inspectDeckOverlay--exit' : 'inspectDeckOverlay inspectDeckOverlay--enter'}
          onAnimationEnd={onOverlayAnimationEnd}
        >
          <div
            className={
              discardOpen ? 'inspectDeckPanel inspectDeckPanel--discard' : 'inspectDeckPanel inspectDeckPanel--deck'
            }
          >
            <InspectPileCloseButton onClose={closeInspectPanel} active={pileOpen} />
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
