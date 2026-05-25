import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from 'react'
import { flushSync } from 'react-dom'
import type { RelicId } from '../core/types/ids'
import { Relics } from '../data/relics'
import { relicImageMap } from './assets/relicImages'
import { getBeltSlotRect, rectRelativeTo, relicIconViewportRect } from './relicBeltLayout'
import { readRootDurationMs } from './relicTooltipPosition'
import { RelicIcon } from './primitives/RelicIcon'

export type RelicTravelRequest = Readonly<{
  templateId: RelicId
  /** Live element when it stays mounted through the flight start. */
  sourceEl?: HTMLElement
  /** Viewport rect of the icon when the source unmounts before travel (e.g. shop purchase). */
  sourceRect?: DOMRect
  beltSlotIndex: number
  onComplete: () => void
}>

type ActiveFlight = Readonly<{
  templateId: RelicId
  from: DOMRect
  to: DOMRect
  onComplete: () => void
  phase: 'start' | 'moving'
}>

type RelicTravelContextValue = Readonly<{
  stageLayerRef: MutableRefObject<HTMLDivElement | null>
  beltRowRef: MutableRefObject<HTMLDivElement | null>
  pendingSlotRef: MutableRefObject<HTMLDivElement | null>
  travelingTemplateId: RelicId | null
  travelRelicToBelt: (req: RelicTravelRequest) => void
}>

const RelicTravelContext = createContext<RelicTravelContextValue | null>(null)

function relicTravelDurationMs(): number {
  if (typeof document === 'undefined') return 700
  return readRootDurationMs('--duration-relic-travel') || 700
}

function relicTravelFinishBufferMs(): number {
  if (typeof document === 'undefined') return 80
  return readRootDurationMs('--relic-travel-finish-buffer') || 80
}

function centerOf(rect: DOMRect): Readonly<{ x: number; y: number }> {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

export function RelicTravelProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const stageLayerRef = useRef<HTMLDivElement | null>(null)
  const beltRowRef = useRef<HTMLDivElement | null>(null)
  const pendingSlotRef = useRef<HTMLDivElement | null>(null)
  const [travelingTemplateId, setTravelingTemplateId] = useState<RelicId | null>(null)
  const [flight, setFlight] = useState<ActiveFlight | null>(null)
  const finishFlightRef = useRef<(() => void) | null>(null)

  const travelRelicToBelt = useCallback((req: RelicTravelRequest) => {
    const stageLayer = stageLayerRef.current
    const beltRow = beltRowRef.current
    if (!stageLayer || !beltRow) {
      req.onComplete()
      return
    }

    const fromViewport =
      req.sourceRect ?? (req.sourceEl != null ? relicIconViewportRect(req.sourceEl) : null)
    if (!fromViewport) {
      req.onComplete()
      return
    }

    const from = rectRelativeTo(stageLayer, fromViewport)

    flushSync(() => {
      setTravelingTemplateId(req.templateId)
    })

    const destEl = pendingSlotRef.current
    const toViewport = destEl
      ? relicIconViewportRect(destEl)
      : getBeltSlotRect(beltRow, req.beltSlotIndex)
    const to = rectRelativeTo(stageLayer, toViewport)

    if (to.width === 0 && to.height === 0) {
      flushSync(() => {
        req.onComplete()
        setTravelingTemplateId(null)
      })
      return
    }

    let finished = false
    const finishFlight = () => {
      if (finished) return
      finished = true
      finishFlightRef.current = null
      // Commit game state (relic on belt, next screen) before clearing the in-flight
      // pending slot so the belt never briefly has zero occupied slots and re-centers.
      flushSync(() => {
        req.onComplete()
        setFlight(null)
        setTravelingTemplateId(null)
      })
    }
    finishFlightRef.current = finishFlight

    setFlight({ templateId: req.templateId, from, to, onComplete: req.onComplete, phase: 'start' })

    requestAnimationFrame(() => {
      setFlight((f) => (f ? { ...f, phase: 'moving' } : null))
      window.setTimeout(finishFlight, relicTravelDurationMs() + relicTravelFinishBufferMs())
    })
  }, [])

  const flyer = flight
    ? (() => {
        const r = Relics[flight.templateId]
        const fromC = centerOf(flight.from)
        const toC = centerOf(flight.to)
        const moving = flight.phase === 'moving'
        return (
          <div
            className={moving ? 'relicTravelFlyer relicTravelFlyer--moving' : 'relicTravelFlyer'}
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
            <div className="relicTravelFlyer__inner">
              <RelicIcon
                imageSrc={relicImageMap[flight.templateId]}
                fallback={r?.thumb ?? '?'}
                alt={r?.name}
                className="relicTravelFlyer__icon"
              />
            </div>
          </div>
        )
      })()
    : null

  return (
    <RelicTravelContext.Provider
      value={{ stageLayerRef, beltRowRef, pendingSlotRef, travelingTemplateId, travelRelicToBelt }}
    >
      <div ref={stageLayerRef} className="gameStageLayer">
        {children}
        {flyer}
      </div>
    </RelicTravelContext.Provider>
  )
}

export function useRelicTravel(): RelicTravelContextValue {
  const ctx = useContext(RelicTravelContext)
  if (!ctx) throw new Error('useRelicTravel must be used within RelicTravelProvider')
  return ctx
}

export function useRelicTravelOptional(): RelicTravelContextValue | null {
  return useContext(RelicTravelContext)
}
