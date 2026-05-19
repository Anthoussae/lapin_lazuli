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
import { GOLD_COIN_SPRITES } from './assets/displayImages'
import { lootPickupBurstViewportCenter } from './cardLayout'
import { CoinBurst } from './primitives/CoinBurst'
import { rectRelativeTo, viewportPointRelativeTo } from './relicBeltLayout'
import { useRelicTravel } from './RelicTravelContext'

export type GoldTravelRequest = Readonly<{
  sourceEl: HTMLElement
  amount: number
  onComplete: () => void
}>

type CoinFlight = Readonly<{
  id: number
  spawnIndex: number
  from: DOMRect
  to: DOMRect
  sprite: string
  rotationDeg: number
  offsetX: number
  offsetY: number
  phase: 'start' | 'moving'
}>

type GoldTravelContextValue = Readonly<{
  goldHudRef: MutableRefObject<HTMLDivElement | null>
  travelingGold: boolean
  travelGoldToHud: (req: GoldTravelRequest) => void
}>

const GoldTravelContext = createContext<GoldTravelContextValue | null>(null)

const TRAVEL_MS = 700
const GOLD_BURST_MS = 560

type ActiveGoldBurst = Readonly<{
  id: number
  x: number
  y: number
  seed: number
}>
const COIN_PX = 32
const SCATTER_DIST_MIN_PX = 5
const SCATTER_DIST_MAX_PX = 50
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

function centerOf(rect: DOMRect): Readonly<{ x: number; y: number }> {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function goldSourceViewportRect(el: HTMLElement): DOMRect {
  const img = el.querySelector('img')
  return (img ?? el).getBoundingClientRect()
}

function pickCoinSprite(): string {
  return GOLD_COIN_SPRITES[Math.random() < 0.5 ? 0 : 1]!
}

/** Evenly spaced angles with jitter; distance in [5, 50] px from pickup center. */
function scatterOffsetForIndex(index: number): Readonly<{ offsetX: number; offsetY: number }> {
  const angleRad = index * GOLDEN_ANGLE + (Math.random() - 0.5) * 0.55
  const distance =
    SCATTER_DIST_MIN_PX + Math.random() * (SCATTER_DIST_MAX_PX - SCATTER_DIST_MIN_PX)
  return {
    offsetX: Math.cos(angleRad) * distance,
    offsetY: Math.sin(angleRad) * distance,
  }
}

function CoinFlyer(props: Readonly<{
  flight: CoinFlight
  startX: number
  startY: number
  endX: number
  endY: number
  onArrived: () => void
}>) {
  const { flight, startX, startY, endX, endY, onArrived } = props
  const moving = flight.phase === 'moving'
  return (
    <div
      className={moving ? 'goldTravelFlyer goldTravelFlyer--moving' : 'goldTravelFlyer'}
      style={{
        ['--travel-x' as string]: `${moving ? endX : startX}px`,
        ['--travel-y' as string]: `${moving ? endY : startY}px`,
        ['--coin-rotation' as string]: `${flight.rotationDeg}deg`,
        zIndex: 10000 + flight.spawnIndex,
      }}
      onTransitionEnd={(e) => {
        if (!moving || e.currentTarget !== e.target) return
        if (e.propertyName !== 'left' && e.propertyName !== 'top') return
        onArrived()
      }}
      aria-hidden
    >
      <div className="goldTravelFlyer__inner" style={{ width: COIN_PX, height: COIN_PX }}>
        <img className="goldTravelFlyer__img" src={flight.sprite} alt="" draggable={false} />
      </div>
    </div>
  )
}

export function GoldTravelProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const goldHudRef = useRef<HTMLDivElement | null>(null)
  const [travelingGold, setTravelingGold] = useState(false)
  const [flights, setFlights] = useState<readonly CoinFlight[]>([])
  const [bursts, setBursts] = useState<ReadonlyArray<ActiveGoldBurst>>([])
  const nextIdRef = useRef(0)
  const nextBurstIdRef = useRef(0)
  const finishOneCoinRef = useRef<(() => void) | null>(null)

  const playGoldBurst = useCallback(
    (sourceEl: HTMLElement) => {
      const stageLayer = stageLayerRef.current
      const viewportCenter = lootPickupBurstViewportCenter(sourceEl)
      if (!stageLayer || !viewportCenter) return

      const { x, y } = viewportPointRelativeTo(stageLayer, viewportCenter.x, viewportCenter.y)
      const id = ++nextBurstIdRef.current
      const seed = (Math.random() * 0x7fffffff) | 0
      setBursts((prev) => [...prev, { id, x, y, seed }])
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id))
      }, GOLD_BURST_MS)
    },
    [stageLayerRef],
  )

  const travelGoldToHud = useCallback((req: GoldTravelRequest) => {
    const stageLayer = stageLayerRef.current
    const goldHud = goldHudRef.current
    const amount = Math.max(0, Math.floor(req.amount))
    if (amount === 0) {
      req.onComplete()
      return
    }
    if (!stageLayer || !goldHud) {
      req.onComplete()
      return
    }

    playGoldBurst(req.sourceEl)

    const fromBase = rectRelativeTo(stageLayer, goldSourceViewportRect(req.sourceEl))
    const to = rectRelativeTo(stageLayer, goldHud.getBoundingClientRect())

    if (to.width === 0 && to.height === 0) {
      req.onComplete()
      return
    }

    const newFlights: CoinFlight[] = []
    for (let i = 0; i < amount; i++) {
      const { offsetX, offsetY } = scatterOffsetForIndex(i)
      newFlights.push({
        id: nextIdRef.current++,
        spawnIndex: i,
        from: fromBase,
        to,
        sprite: pickCoinSprite(),
        rotationDeg: Math.random() * 360,
        offsetX,
        offsetY,
        phase: 'start',
      })
    }

    let finished = false
    let pending = amount
    const finishBatch = () => {
      if (finished) return
      finished = true
      finishOneCoinRef.current = null
      flushSync(() => {
        req.onComplete()
        setFlights([])
        setTravelingGold(false)
      })
    }

    finishOneCoinRef.current = () => {
      pending -= 1
      if (pending <= 0) finishBatch()
    }

    flushSync(() => {
      setTravelingGold(true)
      setFlights(newFlights)
    })

    requestAnimationFrame(() => {
      setFlights((f) => f.map((coin) => (coin.phase === 'start' ? { ...coin, phase: 'moving' } : coin)))
      window.setTimeout(finishBatch, TRAVEL_MS + 80)
    })
  }, [playGoldBurst, stageLayerRef])

  const flyers = flights.map((flight) => {
    const fromC = centerOf(flight.from)
    const toC = centerOf(flight.to)
    const startX = fromC.x + flight.offsetX
    const startY = fromC.y + flight.offsetY
    return (
      <CoinFlyer
        key={flight.id}
        flight={flight}
        startX={startX}
        startY={startY}
        endX={toC.x}
        endY={toC.y}
        onArrived={() => finishOneCoinRef.current?.()}
      />
    )
  })

  return (
    <GoldTravelContext.Provider value={{ goldHudRef, travelingGold, travelGoldToHud }}>
      {children}
      {bursts.map((b) => (
        <div
          key={b.id}
          className="coinBurstHost"
          style={{ left: `${b.x}px`, top: `${b.y}px` }}
          aria-hidden
        >
          <CoinBurst seed={b.seed} />
        </div>
      ))}
      {flyers}
    </GoldTravelContext.Provider>
  )
}

export function useGoldTravel(): GoldTravelContextValue {
  const ctx = useContext(GoldTravelContext)
  if (!ctx) throw new Error('useGoldTravel must be used within GoldTravelProvider')
  return ctx
}
