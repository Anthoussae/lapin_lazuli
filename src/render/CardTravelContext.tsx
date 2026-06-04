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
import {
  cardDeckTravelEndpoints,
  cardDiscardTravelEndpoints,
  cardHandTravelEndpoints,
  cardPullFromDeckEndpoints,
} from './cardLayout'
import { pullFromDeckTotalMs } from './cardPullFromDeckConfig'
import {
  burdenAddToDeckFinishBufferMs,
  burdenAddToDeckFlipBufferMs,
  burdenAddToDeckFlipMs,
  burdenAddToDeckTotalMs,
  burdenAddToDeckTravelMs,
} from './burdenAddFxConfig'
import type { CardDescLine } from '../ui/describe'
import { GameCardView } from './primitives/GameCardView'
import { useRelicTravel } from './RelicTravelContext'
import { readRootDurationMs } from './relicTooltipPosition'

export type CardTravelPayload = Readonly<{
  cardId?: CardId
  name: string
  nameUpgraded?: boolean
  inkLabel: string | null
  inkModified?: boolean
  descriptionLines: ReadonlyArray<CardDescLine>
  socketedGemId?: GemId | null
  foil?: boolean
}>

export type CardTravelProfile = 'default' | 'burden'

export type CardTravelToDeckRequest = Readonly<{
  cardKey: string
  sourceEl: HTMLElement
  card: CardTravelPayload
  onComplete: () => void
  travelProfile?: CardTravelProfile
}>

export type CardTravelFromDeckRequest = Readonly<{
  cardKey: string
  destEl: HTMLElement
  card: CardTravelPayload
  onComplete: () => void
}>

/** Pull from deck to a fixed center in game-stage local coordinates (see {@link cardPullFromDeckEndpoints}). */
export type CardTravelPullFromDeckRequest = Readonly<{
  cardKey: string
  target: Readonly<{ x: number; y: number }>
  card: CardTravelPayload
  onComplete: () => void
}>

export type CardTravelToDiscardRequest = Readonly<{
  cardKey: string
  sourceEl?: HTMLElement
  sourceRect?: DOMRect
  card: CardTravelPayload
  onComplete: () => void
  travelProfile?: CardTravelProfile
}>

type TravelPoint = Readonly<{ x: number; y: number }>

type CardTravelDirection = 'toDeck' | 'fromDeck' | 'pullFromDeck' | 'toDiscard'

function isPullFromDeckDirection(direction: CardTravelDirection): boolean {
  return direction === 'fromDeck' || direction === 'pullFromDeck'
}

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
  /** Only present for `toDeck` so we can recompute endpoints at move start. */
  sourceEl?: HTMLElement
  travelProfile?: CardTravelProfile
}>

type CardTravelContextValue = Readonly<{
  deckInspectImageRef: MutableRefObject<HTMLImageElement | null>
  discardInspectImageRef: MutableRefObject<HTMLImageElement | null>
  travelingCardKey: string | null
  travelingCardKeys: ReadonlySet<string>
  travelingDiscardCardKeys: ReadonlySet<string>
  travelCardToDeck: (req: CardTravelToDeckRequest) => void
  travelCardFromDeck: (req: CardTravelFromDeckRequest) => void
  travelCardPullFromDeck: (req: CardTravelPullFromDeckRequest) => void
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
  if (isPullFromDeckDirection(flight.direction)) {
    return flight.phase === 'flip' || (flight.phase === 'moving' && flight.moving) ? flight.to : flight.from
  }
  return flight.from
}

export function CardTravelProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const deckInspectImageRef = useRef<HTMLImageElement | null>(null)
  const discardInspectImageRef = useRef<HTMLImageElement | null>(null)
  const [travelingCardKey, setTravelingCardKey] = useState<string | null>(null)
  const [travelingCardKeys, setTravelingCardKeys] = useState<ReadonlySet<string>>(() => new Set())
  const travelingCardKeysRef = useRef<Set<string>>(new Set())
  const [travelingDiscardCardKeys, setTravelingDiscardCardKeys] = useState<ReadonlySet<string>>(() => new Set())
  const [flight, setFlight] = useState<ActiveFlight | null>(null)
  const [deckFlights, setDeckFlights] = useState<ReadonlyArray<ActiveFlight>>([])
  const [discardFlights, setDiscardFlights] = useState<ReadonlyArray<ActiveFlight>>([])
  const finishFlightRef = useRef<(() => void) | null>(null)
  const finishDeckByKeyRef = useRef(new Map<string, () => void>())
  const finishDiscardByKeyRef = useRef(new Map<string, () => void>())
  const fromDeckTravelDoneRef = useRef(false)

  const beginToDeckMoving = useCallback(
    (cardKey: string) => {
    const stage = stageLayerRef.current
    const deckImg = deckInspectImageRef.current
    if (!stage || !deckImg) return

    const active = deckFlights.find((f) => f.cardKey === cardKey)
    if (!active?.sourceEl) return

    const endpoints = cardDeckTravelEndpoints(stage, active.sourceEl, deckImg)
    if (!endpoints) return

    setDeckFlights((flights) =>
      flights.map((f) =>
        f.cardKey === cardKey
          ? {
              ...f,
              from: endpoints.from,
              to: endpoints.to,
              phase: 'moving',
              moving: false,
            }
          : f,
      ),
    )

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDeckFlights((flights) =>
          flights.map((f) => (f.cardKey === cardKey ? { ...f, moving: true } : f)),
        )
      })
    })
    },
    [deckFlights, stageLayerRef],
  )

  const beginFromDeckFlip = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlight((f) =>
          f && isPullFromDeckDirection(f.direction) ? { ...f, flipped: false } : f,
        )
      })
    })
  }, [])

  const startPullFromDeckFlight = useCallback(
    (
      req: Readonly<{
        cardKey: string
        card: CardTravelPayload
        from: TravelPoint
        to: TravelPoint
        onComplete: () => void
        direction: 'fromDeck' | 'pullFromDeck'
      }>,
    ) => {
      flushSync(() => {
        setTravelingCardKey(req.cardKey)
        travelingCardKeysRef.current.add(req.cardKey)
        setTravelingCardKeys(new Set(travelingCardKeysRef.current))
      })

      let finished = false
      const finishFlight = () => {
        if (finished) return
        finished = true
        finishFlightRef.current = null
        setFlight(null)
        travelingCardKeysRef.current.delete(req.cardKey)
        setTravelingCardKeys(new Set(travelingCardKeysRef.current))
        setTravelingCardKey(travelingCardKeysRef.current.values().next().value ?? null)
        req.onComplete()
      }
      finishFlightRef.current = finishFlight
      fromDeckTravelDoneRef.current = false

      setFlight({
        cardKey: req.cardKey,
        card: req.card,
        from: req.from,
        to: req.to,
        onComplete: req.onComplete,
        direction: req.direction,
        phase: 'moving',
        flipped: true,
        moving: false,
      })

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlight((f) =>
            f && isPullFromDeckDirection(f.direction) ? { ...f, moving: true } : f,
          )
        })
      })

      const totalMs =
        req.direction === 'pullFromDeck'
          ? pullFromDeckTotalMs()
          : readRootDurationMs('--duration-card-draw-travel') +
            readRootDurationMs('--duration-card-draw-flip') +
            readRootDurationMs('--duration-card-draw-finish-buffer')
      window.setTimeout(finishFlight, totalMs)
    },
    [],
  )

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

      let finished = false
      const finishFlight = () => {
        if (finished) return
        finished = true
        finishDeckByKeyRef.current.delete(req.cardKey)
        setDeckFlights((flights) => flights.filter((f) => f.cardKey !== req.cardKey))
        travelingCardKeysRef.current.delete(req.cardKey)
        setTravelingCardKeys(new Set(travelingCardKeysRef.current))
        setTravelingCardKey(travelingCardKeysRef.current.values().next().value ?? null)
        req.onComplete()
      }
      finishDeckByKeyRef.current.set(req.cardKey, finishFlight)

      const activeFlight: ActiveFlight = {
        cardKey: req.cardKey,
        card: req.card,
        from: endpoints.from,
        to: endpoints.to,
        onComplete: req.onComplete,
        direction: 'toDeck',
        phase: 'flip',
        flipped: false,
        moving: false,
        sourceEl: req.sourceEl,
        travelProfile: req.travelProfile,
      }

      const burdenProfile = req.travelProfile === 'burden'
      const flipMs = burdenProfile ? burdenAddToDeckFlipMs() : TO_DECK_FLIP_MS
      const flipBufferMs = burdenProfile ? burdenAddToDeckFlipBufferMs() : 40
      const totalMs = burdenProfile ? burdenAddToDeckTotalMs() : TO_DECK_FLIP_MS + TO_DECK_TRAVEL_MS + 120

      flushSync(() => {
        setTravelingCardKey(req.cardKey)
        travelingCardKeysRef.current.add(req.cardKey)
        setTravelingCardKeys(new Set(travelingCardKeysRef.current))
        setDeckFlights((flights) => [...flights, activeFlight])
      })

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDeckFlights((flights) =>
            flights.map((f) => (f.cardKey === req.cardKey ? { ...f, flipped: true } : f)),
          )
        })
      })

      window.setTimeout(() => beginToDeckMoving(req.cardKey), flipMs + flipBufferMs)
      window.setTimeout(finishFlight, totalMs)
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

      startPullFromDeckFlight({
        cardKey: req.cardKey,
        card: req.card,
        from: endpoints.from,
        to: endpoints.to,
        onComplete: req.onComplete,
        direction: 'fromDeck',
      })
    },
    [stageLayerRef, startPullFromDeckFlight],
  )

  const travelCardPullFromDeck = useCallback(
    (req: CardTravelPullFromDeckRequest) => {
      const stage = stageLayerRef.current
      const deckImg = deckInspectImageRef.current
      if (!stage || !deckImg) {
        req.onComplete()
        return
      }

      const endpoints = cardPullFromDeckEndpoints(stage, deckImg, req.target)
      if (!endpoints) {
        req.onComplete()
        return
      }

      startPullFromDeckFlight({
        cardKey: req.cardKey,
        card: req.card,
        from: endpoints.from,
        to: endpoints.to,
        onComplete: req.onComplete,
        direction: 'pullFromDeck',
      })
    },
    [stageLayerRef, startPullFromDeckFlight],
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
        travelingCardKeysRef.current.delete(req.cardKey)
        setTravelingCardKeys(new Set(travelingCardKeysRef.current))
        setTravelingDiscardCardKeys((keys) => {
          const next = new Set(keys)
          next.delete(req.cardKey)
          return next
        })
        setTravelingCardKey(travelingCardKeysRef.current.values().next().value ?? null)
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
        travelProfile: req.travelProfile,
      }

      flushSync(() => {
        setTravelingCardKey(req.cardKey)
        travelingCardKeysRef.current.add(req.cardKey)
        setTravelingCardKeys(new Set(travelingCardKeysRef.current))
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

      const burdenProfile = req.travelProfile === 'burden'
      const travelMs = burdenProfile
        ? burdenAddToDeckTravelMs()
        : readRootDurationMs('--duration-card-discard-travel')
      const bufferMs = burdenProfile
        ? burdenAddToDeckFinishBufferMs()
        : readRootDurationMs('--duration-card-discard-finish-buffer')
      window.setTimeout(finishFlight, travelMs + bufferMs)
    },
    [stageLayerRef],
  )

  const onToDeckFlipEnd = useCallback(
    (cardKey: string) => {
      beginToDeckMoving(cardKey)
    },
    [beginToDeckMoving],
  )

  const onFromDeckTravelEnd = useCallback(() => {
    if (fromDeckTravelDoneRef.current) return
    fromDeckTravelDoneRef.current = true
    setFlight((f) =>
      f && isPullFromDeckDirection(f.direction)
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

  const onToDeckTravelEnd = useCallback((cardKey: string) => {
    finishDeckByKeyRef.current.get(cardKey)?.()
  }, [])

  return (
    <CardTravelContext.Provider
      value={{
        deckInspectImageRef,
        discardInspectImageRef,
        travelingCardKey,
        travelingCardKeys,
        travelingDiscardCardKeys,
        travelCardToDeck,
        travelCardFromDeck,
        travelCardPullFromDeck,
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
      {deckFlights.map((deckFlight) => (
        <CardTravelFlyer
          key={deckFlight.cardKey}
          flight={deckFlight}
          pos={cardTravelPosition(deckFlight)}
          onToDeckFlipEnd={onToDeckFlipEnd}
          onToDeckTravelEnd={onToDeckTravelEnd}
          onFromDeckTravelEnd={onFromDeckTravelEnd}
          onFromDeckFlipEnd={onFromDeckFlipEnd}
          onToDiscardTravelEnd={onToDiscardTravelEnd}
        />
      ))}
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
  onToDeckFlipEnd: (cardKey: string) => void
  onToDeckTravelEnd: (cardKey: string) => void
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
  const pullFromDeck = isPullFromDeckDirection(flight.direction)
  const pullFromDeckTokenized = flight.direction === 'pullFromDeck'
  const toDiscard = flight.direction === 'toDiscard'
  const burdenTravel = flight.travelProfile === 'burden'
  const moving = flight.moving
  const pullAtOrigin = pullFromDeck && flight.phase === 'moving' && !moving

  return (
    <div
      className={[
        'cardTravelFlyer',
        pullFromDeck && !pullFromDeckTokenized ? 'cardTravelFlyer--fromDeck' : null,
        pullFromDeckTokenized ? 'cardTravelFlyer--pullFromDeck' : null,
        toDiscard ? 'cardTravelFlyer--toDiscard' : null,
        burdenTravel && toDiscard ? 'cardTravelFlyer--burdenToDiscard' : null,
        burdenTravel && !toDiscard && !pullFromDeck ? 'cardTravelFlyer--burdenToDeck' : null,
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
        if (pullFromDeck) onFromDeckTravelEnd()
        else if (toDiscard) onToDiscardTravelEnd(flight.cardKey)
        else onToDeckTravelEnd(flight.cardKey)
      }}
      aria-hidden
    >
      <div
        className={[
          'cardTravelMotion',
          pullFromDeck && !pullFromDeckTokenized ? 'cardTravelMotion--fromDeck' : null,
          pullFromDeckTokenized ? 'cardTravelMotion--pullFromDeck' : null,
          pullAtOrigin && !pullFromDeckTokenized ? 'cardTravelMotion--fromDeckOrigin' : null,
          pullAtOrigin && pullFromDeckTokenized ? 'cardTravelMotion--pullFromDeckOrigin' : null,
          toDiscard ? 'cardTravelMotion--toDiscard' : null,
          burdenTravel && toDiscard ? 'cardTravelMotion--burdenToDiscard' : null,
          burdenTravel && !toDiscard && !pullFromDeck ? 'cardTravelMotion--burdenToDeck' : null,
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
            if (flight.direction === 'toDeck' && flight.flipped && !moving) onToDeckFlipEnd(flight.cardKey)
            if (pullFromDeck && !flight.flipped && flight.phase === 'flip') onFromDeckFlipEnd()
          }}
        >
          <div className="cardTravelFlipper__face cardTravelFlipper__face--front">
            <GameCardView travelPayload={flight.card} />
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
