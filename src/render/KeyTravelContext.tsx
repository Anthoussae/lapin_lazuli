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
import { keySprite } from './assets/displayImages'
import { rectRelativeTo } from './relicBeltLayout'
import { useRelicTravel } from './RelicTravelContext'

export type KeyTravelRequest = Readonly<{
  sourceEl: HTMLElement
  onComplete: () => void
}>

type ActiveFlight = Readonly<{
  from: DOMRect
  to: DOMRect
  onComplete: () => void
  phase: 'start' | 'moving'
}>

type KeyTravelContextValue = Readonly<{
  keysHudRef: MutableRefObject<HTMLDivElement | null>
  travelingKey: boolean
  travelKeyToHud: (req: KeyTravelRequest) => void
}>

const KeyTravelContext = createContext<KeyTravelContextValue | null>(null)

const TRAVEL_MS = 700

function centerOf(rect: DOMRect): Readonly<{ x: number; y: number }> {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function keySourceViewportRect(el: HTMLElement): DOMRect {
  const img = el.querySelector('img')
  return (img ?? el).getBoundingClientRect()
}

export function KeyTravelProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const keysHudRef = useRef<HTMLDivElement | null>(null)
  const [travelingKey, setTravelingKey] = useState(false)
  const [flight, setFlight] = useState<ActiveFlight | null>(null)
  const finishFlightRef = useRef<(() => void) | null>(null)

  const travelKeyToHud = useCallback((req: KeyTravelRequest) => {
    const stageLayer = stageLayerRef.current
    const keysHud = keysHudRef.current
    if (!stageLayer || !keysHud) {
      req.onComplete()
      return
    }

    const from = rectRelativeTo(stageLayer, keySourceViewportRect(req.sourceEl))
    const to = rectRelativeTo(stageLayer, keysHud.getBoundingClientRect())

    if (to.width === 0 && to.height === 0) {
      req.onComplete()
      return
    }

    flushSync(() => {
      setTravelingKey(true)
    })

    let finished = false
    const finishFlight = () => {
      if (finished) return
      finished = true
      finishFlightRef.current = null
      flushSync(() => {
        req.onComplete()
        setFlight(null)
        setTravelingKey(false)
      })
    }
    finishFlightRef.current = finishFlight

    setFlight({ from, to, onComplete: req.onComplete, phase: 'start' })

    requestAnimationFrame(() => {
      setFlight((f) => (f ? { ...f, phase: 'moving' } : null))
      window.setTimeout(finishFlight, TRAVEL_MS + 80)
    })
  }, [stageLayerRef])

  const flyer = flight
    ? (() => {
        const fromC = centerOf(flight.from)
        const toC = centerOf(flight.to)
        const moving = flight.phase === 'moving'
        return (
          <div
            className={moving ? 'keyTravelFlyer keyTravelFlyer--moving' : 'keyTravelFlyer'}
            style={{
              ['--travel-x' as string]: `${moving ? toC.x : fromC.x}px`,
              ['--travel-y' as string]: `${moving ? toC.y : fromC.y}px`,
            }}
            onTransitionEnd={(e) => {
              if (!moving || e.currentTarget !== e.target) return
              if (e.propertyName !== 'left' && e.propertyName !== 'top') return
              finishFlightRef.current?.()
            }}
            aria-hidden
          >
            <div
              className="keyTravelFlyer__inner"
              style={{ width: flight.from.width, height: flight.from.height }}
            >
              <img className="keyTravelFlyer__img" src={keySprite} alt="" draggable={false} />
            </div>
          </div>
        )
      })()
    : null

  return (
    <KeyTravelContext.Provider value={{ keysHudRef, travelingKey, travelKeyToHud }}>
      {children}
      {flyer}
    </KeyTravelContext.Provider>
  )
}

export function useKeyTravel(): KeyTravelContextValue {
  const ctx = useContext(KeyTravelContext)
  if (!ctx) throw new Error('useKeyTravel must be used within KeyTravelProvider')
  return ctx
}
