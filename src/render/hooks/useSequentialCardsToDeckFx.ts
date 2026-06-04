import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { CardId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { buildGameCardDisplayForOffer, toCardTravelPayload } from '../gameCardDisplay'
import { EMPTY_POWER_DISPLAY, type PowerDisplayContext } from '../../systems/combat/powerDisplay'
import { collectorBulkPreviewHoldMs } from '../collectorBulkConfig'
import { useCardTravel } from '../CardTravelContext'

export type SequentialCardOffer = Readonly<{
  cardId: CardId
  upgrades: number
  foil?: boolean
}>

type UseSequentialCardsToDeckFxArgs = Readonly<{
  /** Full offer list; animation starts at {@link completedCount}. */
  offers: ReadonlyArray<SequentialCardOffer> | null
  completedCount: number
  /** When false, preview/travel timers reset. */
  active: boolean
  cardKeyPrefix: string
  slotRefForIndex: (index: number) => RefObject<HTMLDivElement | null>
  destination: 'deck' | 'discard'
  onApplied: (index: number) => void
  powerDisplay?: PowerDisplayContext
  gameLevel?: number
}>

/** Collector-style preview hold, then flip + travel to deck or discard (one card at a time). */
export function useSequentialCardsToDeckFx(args: UseSequentialCardsToDeckFxArgs) {
  const {
    offers,
    completedCount,
    active,
    cardKeyPrefix,
    slotRefForIndex,
    destination,
    onApplied,
    powerDisplay = EMPTY_POWER_DISPLAY,
    gameLevel = 1,
  } = args

  const { travelCardToDeck, travelCardToDiscard, travelingCardKey } = useCardTravel()
  const previewStartedRef = useRef(false)
  const travelStartedRef = useRef<number | null>(null)
  const [previewReady, setPreviewReady] = useState(false)

  const pendingCount = offers ? Math.max(0, offers.length - completedCount) : 0
  const nextIndex = completedCount
  const nextOffer = pendingCount > 0 ? offers![nextIndex] : null
  const cardKey = nextOffer ? `${cardKeyPrefix}${nextIndex}` : null
  const traveling = cardKey != null && travelingCardKey === cardKey

  useEffect(() => {
    if (!active || pendingCount === 0) {
      previewStartedRef.current = false
      travelStartedRef.current = null
      setPreviewReady(false)
      return
    }
    if (previewStartedRef.current) return
    previewStartedRef.current = true
    setPreviewReady(false)
    const holdMs = collectorBulkPreviewHoldMs()
    const t = window.setTimeout(() => setPreviewReady(true), holdMs)
    return () => window.clearTimeout(t)
  }, [active, pendingCount])

  useLayoutEffect(() => {
    if (!active || !nextOffer || !previewReady || pendingCount === 0) return
    if (traveling || travelingCardKey != null) return

    const slotRef = slotRefForIndex(nextIndex)
    const slotEl = slotRef.current
    if (!slotEl) {
      const id = requestAnimationFrame(() => {
        travelStartedRef.current = null
      })
      return () => cancelAnimationFrame(id)
    }

    if (travelStartedRef.current === nextIndex) return
    travelStartedRef.current = nextIndex

    const t = Cards[nextOffer.cardId]
    const key = `${cardKeyPrefix}${nextIndex}`
    const payload = {
      cardKey: key,
      sourceEl: slotEl,
      card: t
        ? toCardTravelPayload(
            buildGameCardDisplayForOffer(t, nextOffer.upgrades, powerDisplay, nextOffer.foil === true, gameLevel),
          )
        : {
            cardId: nextOffer.cardId,
            name: nextOffer.cardId,
            inkLabel: null,
            descriptionLines: [],
          },
      onComplete: () => {
        travelStartedRef.current = null
        previewStartedRef.current = false
        setPreviewReady(false)
        onApplied(nextIndex)
      },
    }

    if (destination === 'discard') travelCardToDiscard(payload)
    else travelCardToDeck(payload)
  }, [
    active,
    destination,
    gameLevel,
    nextIndex,
    nextOffer,
    onApplied,
    pendingCount,
    powerDisplay,
    previewReady,
    slotRefForIndex,
    travelCardToDeck,
    travelCardToDiscard,
    traveling,
    travelingCardKey,
    cardKeyPrefix,
  ])

  return {
    pendingCount,
    nextIndex,
    cardKey,
    isTraveling: (index: number) => travelingCardKey === `${cardKeyPrefix}${index}`,
    previewReady,
  }
}
