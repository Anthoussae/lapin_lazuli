import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CastBurst } from './primitives/CastBurst'
import { cardCastBurstViewportCenter } from './cardLayout'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveCastBurst = Readonly<{
  id: number
  x: number
  y: number
  seed: number
}>

type CastBurstContextValue = Readonly<{
  playCastBurst: (sourceEl: HTMLElement) => void
}>

const CastBurstContext = createContext<CastBurstContextValue | null>(null)

const CAST_BURST_MS = 560

export function CastBurstProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const nextIdRef = useRef(0)
  const [bursts, setBursts] = useState<ReadonlyArray<ActiveCastBurst>>([])

  const playCastBurst = useCallback((sourceEl: HTMLElement) => {
    const stageLayer = stageLayerRef.current
    const viewportCenter = cardCastBurstViewportCenter(sourceEl)
    if (!stageLayer || !viewportCenter) return

    const { x, y } = viewportPointRelativeTo(stageLayer, viewportCenter.x, viewportCenter.y)
    const id = ++nextIdRef.current
    const seed = (Math.random() * 0x7fffffff) | 0
    setBursts((prev) => [...prev, { id, x, y, seed }])
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id))
    }, CAST_BURST_MS)
  }, [stageLayerRef])

  return (
    <CastBurstContext.Provider value={{ playCastBurst }}>
      {children}
      {bursts.map((b) => (
        <div
          key={b.id}
          className="castBurstHost"
          style={{ left: `${b.x}px`, top: `${b.y}px` }}
          aria-hidden
        >
          <CastBurst seed={b.seed} />
        </div>
      ))}
    </CastBurstContext.Provider>
  )
}

export function useCastBurst(): CastBurstContextValue {
  const ctx = useContext(CastBurstContext)
  if (!ctx) throw new Error('useCastBurst must be used within CastBurstProvider')
  return ctx
}
