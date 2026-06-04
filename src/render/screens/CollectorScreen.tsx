import { useLayoutEffect, useRef, useState } from 'react'
import { Cards } from '../../data/cards'
import { formatCardInstanceDisplayName } from '../../ui/describe'
import { cardTravelPayloadForInstance } from '../cardSocketFlipPayload'
import { powerDisplayContextFromPlayer } from '../../systems/combat/powerDisplay'
import { useSequentialCardsToDeckFx } from '../hooks/useSequentialCardsToDeckFx'
import { plainYellowBackdrop } from '../assets/backdropImages'
import { collectorSprite, speechBubbleRightSprite } from '../assets/displayImages'
import { useCardConsume } from '../CardConsumeContext'
import { useCardTravel } from '../CardTravelContext'
import { centerOf } from '../cardLayout'
import { useGoldTravel } from '../GoldTravelContext'
import { viewportPointRelativeTo } from '../relicBeltLayout'
import { useRelicTravel } from '../RelicTravelContext'
import { GameCardView } from '../primitives/GameCardView'
import { RestChoiceButton } from '../primitives/RestChoiceButton'
import type { ScreenProps } from './types'

const COLLECTOR_DIALOGUE_SOLD = "Pleasure doing business!"
const COLLECTOR_DIALOGUE_BULK = 'Here ya go!'

type CollectorDialogueKind = 'intro' | 'sold' | 'bulk'

function CollectorDialogue(props: Readonly<{
  kind: CollectorDialogueKind
  cardName: string
  sellPrice: number
}>) {
  const { kind, cardName, sellPrice } = props
  if (kind === 'sold') {
    return <p className="collectorDialogue">{COLLECTOR_DIALOGUE_SOLD}</p>
  }
  if (kind === 'bulk') {
    return <p className="collectorDialogue">{COLLECTOR_DIALOGUE_BULK}</p>
  }
  return (
    <p className="collectorDialogue">
      Nice <span className="collectorDialogue__cardName">{cardName}</span> you&apos;ve got there! Can I buy
      it for <span className="collectorDialogue__sellPrice">{sellPrice}</span> gold, or would you prefer some
      bulk cards from my binder?
    </p>
  )
}

export function CollectorScreen({ state, enqueue }: ScreenProps) {
  const { travelCardPullFromDeck, travelingCardKey, deckInspectImageRef } = useCardTravel()
  const { travelGoldToHud, travelingGold } = useGoldTravel()
  const { playCardConsume } = useCardConsume()
  const { stageLayerRef } = useRelicTravel()
  const offerAnchorRef = useRef<HTMLDivElement | null>(null)
  const sellBtnRef = useRef<HTMLButtonElement | null>(null)
  const bulkSlot0Ref = useRef<HTMLDivElement | null>(null)
  const bulkSlot1Ref = useRef<HTMLDivElement | null>(null)
  const bulkSlotRefs = [bulkSlot0Ref, bulkSlot1Ref] as const
  const pullStartedRef = useRef(false)
  const [selling, setSelling] = useState(false)
  const [offerCardHidden, setOfferCardHidden] = useState(false)
  const [dialogueKind, setDialogueKind] = useState<CollectorDialogueKind>('intro')

  const collector = state.mysteryRoom?.collector
  const offeredId = collector?.offeredCardInstanceId ?? null
  const cardRevealed = collector?.cardRevealed === true
  const sold = collector?.sold === true
  const bulkAccepted = collector?.bulkAccepted === true
  const bulkCards = collector?.bulkCards ?? null
  const bulkCardsAdded = collector?.bulkCardsAdded ?? 0
  const sellPrice = collector?.sellPrice ?? 0
  const inst = offeredId ? state.player.deck.cardById[offeredId] : undefined
  const template = inst ? Cards[inst.templateId] : undefined
  const powerDisplay = powerDisplayContextFromPlayer(state.player)

  const cardName = inst && template ? formatCardInstanceDisplayName(template, inst) : 'card'
  const sellTooltip = `Sell ${cardName} for ${sellPrice} gold`

  const bulkTraveling = travelingCardKey?.startsWith('collector-bulk-') === true
  const choiceLocked = sold || bulkAccepted || selling || travelingGold || bulkTraveling
  const canSell = cardRevealed && !!offeredId && !!inst && !choiceLocked
  const canAcceptBulk = cardRevealed && !choiceLocked
  const canProceed = sold || bulkAccepted

  const { isTraveling: isBulkTraveling } = useSequentialCardsToDeckFx({
    offers: bulkCards,
    completedCount: bulkCardsAdded,
    active: bulkAccepted,
    cardKeyPrefix: 'collector-bulk-',
    slotRefForIndex: (index) => bulkSlotRefs[index]!,
    destination: 'deck',
    onApplied: (index) => enqueue({ type: 'COLLECTOR/ADD_BULK_CARD', index }),
    powerDisplay,
    gameLevel: state.level,
  })

  const handleAcceptBulk = () => {
    if (!canAcceptBulk) return
    setDialogueKind('bulk')
    enqueue({ type: 'COLLECTOR/ACCEPT_BULK' })
  }

  useLayoutEffect(() => {
    if (pullStartedRef.current || cardRevealed || !offeredId || !inst || !template) return

    const tryStartPull = () => {
      const stage = stageLayerRef.current
      const deckImg = deckInspectImageRef.current
      const anchor = offerAnchorRef.current
      if (!stage || !deckImg || !anchor) return false

      const targetCenter = centerOf(anchor.getBoundingClientRect())
      if (!targetCenter) return false

      pullStartedRef.current = true
      travelCardPullFromDeck({
        cardKey: offeredId,
        target: viewportPointRelativeTo(stage, targetCenter.x, targetCenter.y),
        card: cardTravelPayloadForInstance(template, inst, powerDisplay, state.level),
        onComplete: () => enqueue({ type: 'COLLECTOR/REVEAL_OFFERED_CARD' }),
      })
      return true
    }

    if (tryStartPull()) return
    const id = requestAnimationFrame(() => {
      if (!tryStartPull()) pullStartedRef.current = false
    })
    return () => cancelAnimationFrame(id)
  }, [
    cardRevealed,
    deckInspectImageRef,
    enqueue,
    inst,
    offeredId,
    powerDisplay,
    stageLayerRef,
    template,
    travelCardPullFromDeck,
  ])

  const handleSell = () => {
    if (!canSell || !offeredId) return
    const anchor = offerAnchorRef.current
    const sellBtn = sellBtnRef.current
    if (!anchor || !sellBtn) return

    setDialogueKind('sold')
    setOfferCardHidden(true)
    setSelling(true)
    playCardConsume({
      cardInstanceId: offeredId,
      sourceEl: anchor,
      hostClassName: 'cardConsumeHost--collectorSell',
      onComplete: () => {
        travelGoldToHud({
          sourceEl: sellBtn,
          amount: sellPrice,
          onComplete: () => {
            enqueue({ type: 'COLLECTOR/SELL' })
            setSelling(false)
          },
        })
      },
    })
  }

  const showOfferedCard =
    cardRevealed && offeredId && inst && template && !sold && !bulkAccepted && !offerCardHidden
  const cardFlying = travelingCardKey === offeredId


  return (
    <>
      <div className="screenBackdrop screenBackdrop--collector" aria-hidden>
        <img className="screenBackdrop__img" src={plainYellowBackdrop} alt="" draggable={false} />
      </div>
      <img className="collectorArt" src={collectorSprite} alt="" draggable={false} />
      <img
        className="collectorSpeechBubble"
        src={speechBubbleRightSprite}
        alt=""
        draggable={false}
      />
      <CollectorDialogue kind={dialogueKind} cardName={cardName} sellPrice={sellPrice} />
      <h1 className="collectorTitle">The Collector</h1>
      <div
        ref={offerAnchorRef}
        className={[
          'collectorOfferedCard',
          showOfferedCard && !cardFlying ? 'collectorOfferedCard--glow' : null,
          showOfferedCard && !cardFlying ? null : 'collectorOfferedCard--hidden',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={!showOfferedCard}
      >
        {showOfferedCard ? (
          <>
            <div className="collectorOfferedCard__glow" aria-hidden />
            <div className="collectorOfferedCard__card">
              <GameCardView
                cardInstanceId={offeredId}
                inst={inst}
                template={template}
                powerDisplay={powerDisplay}
                gameLevel={state.level}
              />
            </div>
          </>
        ) : null}
      </div>
      <RestChoiceButton
        ref={sellBtnRef}
        label={`Sell (+${sellPrice} gold)`}
        tooltipText={sellTooltip}
        tooltipSingleLine
        className="btn collectorSellBtn"
        disabled={!canSell}
        onClick={handleSell}
      />
      {bulkCards?.map((offer, idx) => {
        const t = Cards[offer.cardId]
        const cardKey = `collector-bulk-${idx}`
        const isTraveling = isBulkTraveling(idx)
        const showSlot = bulkAccepted && idx >= bulkCardsAdded && !isTraveling
        return (
          <div
            key={cardKey}
            ref={bulkSlotRefs[idx]}
            className={[
              'collectorBulkCard',
              `collectorBulkCard--${idx}`,
              showSlot ? null : 'collectorBulkCard--hidden',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden={!showSlot}
          >
            {showSlot ? (
              <GameCardView
                template={t}
                offerUpgradeApplications={offer.upgrades}
                offerFoil={offer.foil === true}
                powerDisplay={powerDisplay}
                gameLevel={state.level}
                className={isTraveling ? 'gameCard--traveling' : undefined}
              />
            ) : null}
          </div>
        )
      })}
      <RestChoiceButton
        label="Accept bulk"
        tooltipText="Add two random cards to your deck."
        tooltipSingleLine
        className="btn collectorAcceptBulkBtn"
        disabled={!canAcceptBulk}
        onClick={handleAcceptBulk}
      />
      <button
        type="button"
        className="btn collectorProceedBtn"
        disabled={!canProceed}
        onClick={() => enqueue({ type: 'EVENT/PROCEED' })}
      >
        Proceed
      </button>
    </>
  )
}
