import { useCallback, useEffect, useRef, useState, type AnimationEvent } from 'react'
import type { GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import { useCardTravelOptional } from '../CardTravelContext'
import { deckInspectSprite, discardInspectSpriteForCount } from '../assets/displayImages'
import { useTriggerFxArtProps } from '../TriggerFxContext'
import { useCardConsume } from '../CardConsumeContext'
import { fontOfLetheForgetConsumeDelayMs } from '../fontOfLetheForgetFxConfig'
import { powerDisplayContextFromPlayer, powerDisplayContextFromState } from '../../systems/combat/powerDisplay'
import { GameCardView } from './GameCardView'
import { InspectPileCardSlot } from './InspectPileCardSlot'
import { InspectPileCloseButton } from './InspectPileCloseButton'
import { OpaqueImageButton } from './OpaqueImageButton'

function collectorDeckHighlightId(state: GameState): string | null {
  if (state.phase !== 'EVENT' || state.mysteryRoom?.roomId !== 'COLLECTOR') return null
  const collector = state.mysteryRoom.collector
  if (!collector || collector.sold || collector.bulkAccepted) return null
  return collector.offeredCardInstanceId ?? null
}

export function DeckInspect(props: Readonly<{ state: GameState; inCombat: boolean }>) {
  const { state, inCombat } = props
  const highlightCardInstanceId = collectorDeckHighlightId(state)
  const [deckOpen, setDeckOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const pileOpen = deckOpen || discardOpen
  const [overlayMounted, setOverlayMounted] = useState(false)
  const [overlayExiting, setOverlayExiting] = useState(false)
  const powerDisplay = inCombat ? powerDisplayContextFromState(state) : powerDisplayContextFromPlayer(state.player)

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
  const deckFx = useTriggerFxArtProps({ kind: 'deck' })
  const { playCardConsume } = useCardConsume()
  const [folGlowKey, setFolGlowKey] = useState(0)
  const prevForgottenRef = useRef(false)

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

  useEffect(() => {
    const fol = state.mysteryRoom?.fontOfLethe
    const forgotten = fol?.cardForgotten === true
    const justForgot = forgotten && !prevForgottenRef.current
    prevForgottenRef.current = forgotten
    if (!justForgot) return

    // Deck glow: force a new img key so the CSS animation restarts reliably.
    setFolGlowKey((n) => n + 1)

    // Consume burst on the deck icon (and let the dialog separately spawn one for the card).
    const deckImg = cardTravel?.deckInspectImageRef.current
    if (deckImg) {
      const delay = fontOfLetheForgetConsumeDelayMs()
      window.setTimeout(() => playCardConsume({ sourceEl: deckImg }), delay)
    }
  }, [state.mysteryRoom?.fontOfLethe?.cardForgotten, cardTravel?.deckInspectImageRef, playCardConsume])

  return (
    <>
      {inCombat ? (
        <OpaqueImageButton
          className={discardOpen ? 'inspectDiscardBtn inspectDiscardBtn--panelOpen' : 'inspectDiscardBtn'}
          imageClassName="inspectDiscardBtn__img"
          imageRef={cardTravel?.discardInspectImageRef}
          src={discardInspectSpriteForCount(discardPileCount)}
          alt="Inspect discard pile"
          hoverOverlay={discardPileCount}
          onClick={() => setDiscardOpen((v) => !v)}
        />
      ) : null}
      <OpaqueImageButton
        className={deckOpen ? 'inspectDeckBtn inspectDeckBtn--panelOpen' : 'inspectDeckBtn'}
        imageClassName={[
          'inspectDeckBtn__img',
          deckFx.className,
          folGlowKey > 0 ? 'inspectDeckBtn__img--fontOfLetheForgetGlow' : null,
        ]
          .filter(Boolean)
          .join(' ')}
        imageKey={(deckFx.key ?? 0) + folGlowKey * 1000}
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
                      <InspectPileCardSlot
                        key={`pile-${idx}-${cid}`}
                        collectorOffered={highlightCardInstanceId === cid}
                      >
                        <GameCardView
                          cardInstanceId={cid}
                          inst={inst}
                          template={t}
                          powerDisplay={powerDisplay}
                          gameLevel={state.level}
                        />
                      </InspectPileCardSlot>
                    )
                  })}
                </>
              ) : (
                Object.values(state.player.deck.cardById).map((inst) => {
                  const t = Cards[inst.templateId]
                  return (
                    <InspectPileCardSlot
                      key={inst.id}
                      collectorOffered={highlightCardInstanceId === inst.id}
                    >
                      <GameCardView
                        inst={inst}
                        template={t}
                        powerDisplay={powerDisplay}
                        gameLevel={state.level}
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
