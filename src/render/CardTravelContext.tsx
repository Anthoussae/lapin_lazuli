import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { flushSync } from 'react-dom'
import type { CardId, GemId } from '../core/types/ids'
import { cardBackArt } from './assets/cardImages'
import { cardDeckTravelEndpoints, cardDiscardTravelEndpoints, cardHandTravelEndpoints } from './cardLayout'
import type { CardDescLine } from '../ui/describe'
import { Card } from './primitives/Card'
import { useRelicTravel } from './RelicTravelContext'
import { readRootDurationMs } from './relicTooltipPosition'

export type CardTravelPayload = Readonly<{
  cardId?: CardId
  name: string
  nameUpgraded?: boolean
  inkLabel: string | null
  descriptionLines: ReadonlyArray<CardDescLine>
  socketedGemId?: GemId | null
}>

export type CardTravelToDeckRequest = Readonly<{
  cardKey: string
  sourceEl: HTMLElement
  card: CardTravelPayload
  onComplete: () => void
}>

export type CardTravelFromDeckRequest = Readonly<{
  cardKey: string
  destEl: HTMLElement
  card: CardTravelPayload
  onComplete: () => void
}>

export type CardTravelToDiscardRequest = Readonly<{
  cardKey: string
  sourceEl?: HTMLElement
  sourceRect?: DOMRect
  card: CardTravelPayload
  onComplete: () => void
}>

type TravelPoint = Readonly<{ x: number; y: number }>

type CardTravelDirection = 'toDeck' | 'fromDeck' | 'toDiscard'

type ActiveFlight = Readonly<{
  cardKey: string
  card: CardTravelPayload
  from: TravelPoint
  to: TravelPoint
  onComplete: () => void
  direction: CardTravelDirection
  phase: 'flip' | 'moving'
  flipped: boolean
  moving: boolean
}>

type CardTravelContextValue = Readonly<{
  deckInspectImageRef: MutableRefObject<HTMLImageElement | null>
  discardInspectImageRef: MutableRefObject<HTMLImageElement | null>
  travelingCardKey: string | null
  travelingDiscardCardKeys: ReadonlySet<string>
  travelCardToDeck: (req: CardTravelToDeckRequest) => void
  travelCardFromDeck: (req: CardTravelFromDeckRequest) => void
  travelCardToDiscard: (req: CardTravelToDiscardRequest) => void
}>

const CardTravelContext = createContext<CardTravelContextValue | null>(null)

const TO_DECK_FLIP_MS = 450
const TO_DECK_TRAVEL_MS = 500

function cardTravelPosition(flight: ActiveFlight): TravelPoint {
  if (flight.direction === 'toDeck') {
    return flight.phase === 'moving' && flight.moving ? flight.to : flight.from
  }
  if (flight.direction === 'toDiscard') {
    return flight.phase === 'moving' && flight.moving ? flight.to : flight.from
  }
  return flight.phase === 'flip' || (flight.phase === 'moving' && flight.moving) ? flight.to : flight.from
}

export function CardTravelProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const deckInspectImageRef = useRef<HTMLImageElement | null>(null)
  const discardInspectImageRef = useRef<HTMLImageElement | null>(null)
  const pendingToDeckRef = useRef<CardTravelToDeckRequest | null>(null)
  const [travelingCardKey, setTravelingCardKey] = useState<string | null>(null)
  const [travelingDiscardCardKeys, setTravelingDiscardCardKeys] = useState<ReadonlySet<string>>(() => new Set())
  const [flight, setFlight] = useState<ActiveFlight | null>(null)
  const [discardFlights, setDiscardFlights] = useState<ReadonlyArray<ActiveFlight>>([])
  const finishFlightRef = useRef<(() => void) | null>(null)
  const finishDiscardByKeyRef = useRef(new Map<string, () => void>())
  const fromDeckTravelDoneRef = useRef(false)

  const beginToDeckMoving = useCallback(() => {
    const stage = stageLayerRef.current
    const deckImg = deckInspectImageRef.current
    const pending = pendingToDeckRef.current
    if (!stage || !deckImg || !pending) return

    const endpoints = cardDeckTravelEndpoints(stage, pending.sourceEl, deckImg)
    if (!endpoints) return

    setFlight((f) =>
      f && f.direction === 'toDeck'
        ? {
            ...f,
            from: endpoints.from,
            to: endpoints.to,
            phase: 'moving',
            moving: false,
          }
        : f,
    )

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlight((f) => (f && f.direction === 'toDeck' ? { ...f, moving: true } : f))
      })
    })
  }, [stageLayerRef])

  const beginFromDeckFlip = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlight((f) => (f && f.direction === 'fromDeck' ? { ...f, flipped: false } : f))
      })
    })
  }, [])

  const finishActiveFlight = useCallback(() => {
    finishFlightRef.current?.()
  }, [])

  const travelCardToDeck = useCallback(
    (req: CardTravelToDeckRequest) => {
      const stage = stageLayerRef.current
      const deckImg = deckInspectImageRef.current
      if (!stage || !deckImg) {
        req.onComplete()
        return
      }

      const endpoints = cardDeckTravelEndpoints(stage, req.sourceEl, deckImg)
      if (!endpoints) {
        req.onComplete()
        return
      }

      pendingToDeckRef.current = req

      flushSync(() => {
        setTravelingCardKey(req.cardKey)
      })

      let finished = false
      const finishFlight = () => {
        if (finished) return
        finished = true
        finishFlightRef.current = null
        pendingToDeckRef.current = null
        setFlight(null)
        setTravelingCardKey(null)
        req.onComplete()
      }
      finishFlightRef.current = finishFlight

      setFlight({
        cardKey: req.cardKey,
        card: req.card,
        from: endpoints.from,
        to: endpoints.to,
        onComplete: req.onComplete,
        direction: 'toDeck',
        phase: 'flip',
        flipped: false,
        moving: false,
      })

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlight((f) => (f && f.direction === 'toDeck' ? { ...f, flipped: true } : f))
        })
      })

      window.setTimeout(beginToDeckMoving, TO_DECK_FLIP_MS + 40)
      window.setTimeout(finishFlight, TO_DECK_FLIP_MS + TO_DECK_TRAVEL_MS + 120)
    },
    [beginToDeckMoving, stageLayerRef],
  )

  const travelCardFromDeck = useCallback(
    (req: CardTravelFromDeckRequest) => {
      const stage = stageLayerRef.current
      const deckImg = deckInspectImageRef.current
      if (!stage || !deckImg) {
        req.onComplete()
        return
      }

      const endpoints = cardHandTravelEndpoints(stage, deckImg, req.destEl)
      if (!endpoints) {
        req.onComplete()
        return
      }

      flushSync(() => {
        setTravelingCardKey(req.cardKey)
      })

      let finished = false
      const finishFlight = () => {
        if (finished) return
        finished = true
        finishFlightRef.current = null
        setFlight(null)
        setTravelingCardKey(null)
        req.onComplete()
      }
      finishFlightRef.current = finishFlight
      fromDeckTravelDoneRef.current = false

      setFlight({
        cardKey: req.cardKey,
        card: req.card,
        from: endpoints.from,
        to: endpoints.to,
        onComplete: req.onComplete,
        direction: 'fromDeck',
        phase: 'moving',
        flipped: true,
        moving: false,
      })

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlight((f) => (f && f.direction === 'fromDeck' ? { ...f, moving: true } : f))
        })
      })

      const travelMs = readRootDurationMs('--duration-card-draw-travel')
      const flipMs = readRootDurationMs('--duration-card-draw-flip')
      const bufferMs = readRootDurationMs('--duration-card-draw-finish-buffer')
      window.setTimeout(finishFlight, travelMs + flipMs + bufferMs)
    },
    [stageLayerRef],
  )

  const travelCardToDiscard = useCallback(
    (req: CardTravelToDiscardRequest) => {
      const stage = stageLayerRef.current
      const discardImg = discardInspectImageRef.current
      if (!stage || !discardImg || (!req.sourceEl && !req.sourceRect)) {
        req.onComplete()
        return
      }

      const endpoints = cardDiscardTravelEndpoints(stage, discardImg, {
        el: req.sourceEl,
        rect: req.sourceRect,
      })
      if (!endpoints) {
        req.onComplete()
        return
      }

      let finished = false
      const finishFlight = () => {
        if (finished) return
        finished = true
        finishDiscardByKeyRef.current.delete(req.cardKey)
        setDiscardFlights((flights) => flights.filter((f) => f.cardKey !== req.cardKey))
        setTravelingDiscardCardKeys((keys) => {
          const next = new Set(keys)
          next.delete(req.cardKey)
          return next
        })
        req.onComplete()
      }
      finishDiscardByKeyRef.current.set(req.cardKey, finishFlight)

      const activeFlight: ActiveFlight = {
        cardKey: req.cardKey,
        card: req.card,
        from: endpoints.from,
        to: endpoints.to,
        onComplete: req.onComplete,
        direction: 'toDiscard',
        phase: 'moving',
        flipped: false,
        moving: false,
      }

      flushSync(() => {
        setTravelingDiscardCardKeys((keys) => new Set(keys).add(req.cardKey))
        setDiscardFlights((flights) => [...flights, activeFlight])
      })

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDiscardFlights((flights) =>
            flights.map((f) => (f.cardKey === req.cardKey ? { ...f, moving: true } : f)),
          )
        })
      })

      const travelMs = readRootDurationMs('--duration-card-discard-travel')
      const bufferMs = readRootDurationMs('--duration-card-discard-finish-buffer')
      window.setTimeout(finishFlight, travelMs + bufferMs)
    },
    [stageLayerRef],
  )

  const onToDeckFlipEnd = useCallback(() => {
    beginToDeckMoving()
  }, [beginToDeckMoving])

  const onFromDeckTravelEnd = useCallback(() => {
    if (fromDeckTravelDoneRef.current) return
    fromDeckTravelDoneRef.current = true
    setFlight((f) =>
      f && f.direction === 'fromDeck'
        ? {
            ...f,
            phase: 'flip',
            moving: false,
          }
        : f,
    )
    beginFromDeckFlip()
  }, [beginFromDeckFlip])

  const onFromDeckFlipEnd = useCallback(() => {
    finishActiveFlight()
  }, [finishActiveFlight])

  const onToDiscardTravelEnd = useCallback((cardKey: string) => {
    finishDiscardByKeyRef.current.get(cardKey)?.()
  }, [])

  const onToDeckTravelEnd = useCallback(() => {
    finishActiveFlight()
  }, [finishActiveFlight])

  return (
    <CardTravelContext.Provider
      value={{
        deckInspectImageRef,
        discardInspectImageRef,
        travelingCardKey,
        travelingDiscardCardKeys,
        travelCardToDeck,
        travelCardFromDeck,
        travelCardToDiscard,
      }}
    >
      {children}
      {flight ? (
        <CardTravelFlyer
          flight={flight}
          pos={cardTravelPosition(flight)}
          onToDeckFlipEnd={onToDeckFlipEnd}
          onToDeckTravelEnd={onToDeckTravelEnd}
          onFromDeckTravelEnd={onFromDeckTravelEnd}
          onFromDeckFlipEnd={onFromDeckFlipEnd}
          onToDiscardTravelEnd={onToDiscardTravelEnd}
        />
      ) : null}
      {discardFlights.map((discardFlight) => (
        <CardTravelFlyer
          key={discardFlight.cardKey}
          flight={discardFlight}
          pos={cardTravelPosition(discardFlight)}
          onToDeckFlipEnd={onToDeckFlipEnd}
          onToDeckTravelEnd={onToDeckTravelEnd}
          onFromDeckTravelEnd={onFromDeckTravelEnd}
          onFromDeckFlipEnd={onFromDeckFlipEnd}
          onToDiscardTravelEnd={onToDiscardTravelEnd}
        />
      ))}
    </CardTravelContext.Provider>
  )
}


function CardTravelFlyer(props: Readonly<{
  flight: ActiveFlight
  pos: TravelPoint
  onToDeckFlipEnd: () => void
  onToDeckTravelEnd: () => void
  onFromDeckTravelEnd: () => void
  onFromDeckFlipEnd: () => void
  onToDiscardTravelEnd: (cardKey: string) => void
}>) {
  const {
    flight,
    pos,
    onToDeckFlipEnd,
    onToDeckTravelEnd,
    onFromDeckTravelEnd,
    onFromDeckFlipEnd,
    onToDiscardTravelEnd,
  } = props
  const fromDeck = flight.direction === 'fromDeck'
  const toDiscard = flight.direction === 'toDiscard'
  const moving = flight.moving
  const fromDeckAtOrigin = fromDeck && flight.phase === 'moving' && !moving

  return (
    <div
      className={[
        'cardTravelFlyer',
        fromDeck ? 'cardTravelFlyer--fromDeck' : null,
        toDiscard ? 'cardTravelFlyer--toDiscard' : null,
        moving ? 'cardTravelFlyer--moving' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ['--travel-x' as string]: `${pos.x}px`,
        ['--travel-y' as string]: `${pos.y}px`,
      }}
      onTransitionEnd={(e) => {
        if (e.currentTarget !== e.target) return
        if (!moving || (e.propertyName !== 'left' && e.propertyName !== 'top')) return
        if (fromDeck) onFromDeckTravelEnd()
        else if (toDiscard) onToDiscardTravelEnd(flight.cardKey)
        else onToDeckTravelEnd()
      }}
      aria-hidden
    >
      <div
        className={[
          'cardTravelMotion',
          fromDeck ? 'cardTravelMotion--fromDeck' : null,
          fromDeckAtOrigin ? 'cardTravelMotion--fromDeckOrigin' : null,
          toDiscard ? 'cardTravelMotion--toDiscard' : null,
          moving ? 'cardTravelMotion--moving' : null,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className={['cardTravelFlipper', flight.flipped ? 'cardTravelFlipper--flipped' : null]
            .filter(Boolean)
            .join(' ')}
          onTransitionEnd={(e) => {
            if (e.currentTarget !== e.target) return
            if (e.propertyName !== 'transform') return
            if (flight.direction === 'toDeck' && flight.flipped && !moving) onToDeckFlipEnd()
            if (fromDeck && !flight.flipped && flight.phase === 'flip') onFromDeckFlipEnd()
          }}
        >
          <div className="cardTravelFlipper__face cardTravelFlipper__face--front">
            <Card
              face="front"
              cardId={flight.card.cardId}
              name={flight.card.name}
              nameUpgraded={flight.card.nameUpgraded}
              inkLabel={flight.card.inkLabel}
              descriptionLines={flight.card.descriptionLines}
              socketedGemId={flight.card.socketedGemId ?? null}
              staticDisplay
            />
          </div>
          <div className="cardTravelFlipper__face cardTravelFlipper__face--back">
            <img className="cardTravelFlipper__backImg" src={cardBackArt} alt="" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  )
}


export function useCardTravel(): CardTravelContextValue {
  const ctx = useContext(CardTravelContext)
  if (!ctx) throw new Error('useCardTravel must be used within CardTravelProvider')
  return ctx
}

export function useCardTravelOptional(): CardTravelContextValue | null {
  return useContext(CardTravelContext)
}
