import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CardInstanceId } from '../core/types/ids'
import { centerOf, cardViewportRect } from './cardLayout'
import { CardConsumeFx } from './primitives/CardConsumeFx'
import { cardConsumeTotalMs } from './cardConsumeConfig'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type CssVarStyle = Readonly<Record<`--${string}`, string>>

type ActiveCardConsume = Readonly<{
  id: number
  x: number
  y: number
  seed: number
  hostClassName?: string
  hostStyle?: CssVarStyle
}>

export type CardConsumeRequest = Readonly<{
  /** When set, only one FX runs per card instance (duplicate calls invoke onComplete immediately). */
  cardInstanceId?: CardInstanceId
  sourceEl?: HTMLElement
  sourceRect?: DOMRect
  /** Optional host class for per-call styling overrides (CSS vars etc). */
  hostClassName?: string
  /** Optional per-call CSS var overrides applied to the host element. */
  hostStyle?: CssVarStyle
  onComplete?: () => void
}>

type CardConsumeContextValue = Readonly<{
  playCardConsume: (req: CardConsumeRequest) => void
}>

const CardConsumeContext = createContext<CardConsumeContextValue | null>(null)

export function CardConsumeProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const nextIdRef = useRef(0)
  const onCompleteByIdRef = useRef(new Map<number, () => void>())
  const cardInstanceByFxIdRef = useRef(new Map<number, CardInstanceId>())
  const finishedIdsRef = useRef(new Set<number>())
  const activeCardIdsRef = useRef(new Set<CardInstanceId>())
  const [fxList, setFxList] = useState<ReadonlyArray<ActiveCardConsume>>([])

  const finishFx = useCallback((fxId: number) => {
    if (finishedIdsRef.current.has(fxId)) return
    finishedIdsRef.current.add(fxId)
    setFxList((prev) => prev.filter((f) => f.id !== fxId))
    const cardInstanceId = cardInstanceByFxIdRef.current.get(fxId)
    cardInstanceByFxIdRef.current.delete(fxId)
    if (cardInstanceId) activeCardIdsRef.current.delete(cardInstanceId)
    const done = onCompleteByIdRef.current.get(fxId)
    onCompleteByIdRef.current.delete(fxId)
    done?.()
  }, [])

  const playCardConsume = useCallback(
    (req: CardConsumeRequest) => {
      const cardInstanceId = req.cardInstanceId
      if (cardInstanceId && activeCardIdsRef.current.has(cardInstanceId)) {
        req.onComplete?.()
        return
      }

      const stageLayer = stageLayerRef.current
      if (!stageLayer) {
        req.onComplete?.()
        return
      }

      const fromViewport = req.sourceEl
        ? centerOf(cardViewportRect(req.sourceEl))
        : req.sourceRect
          ? centerOf(req.sourceRect)
          : null
      if (!fromViewport) {
        req.onComplete?.()
        return
      }

      const { x, y } = viewportPointRelativeTo(stageLayer, fromViewport.x, fromViewport.y)
      const id = ++nextIdRef.current
      const seed = (Math.random() * 0x7fffffff) | 0
      if (cardInstanceId) {
        activeCardIdsRef.current.add(cardInstanceId)
        cardInstanceByFxIdRef.current.set(id, cardInstanceId)
      }
      if (req.onComplete) onCompleteByIdRef.current.set(id, req.onComplete)
      setFxList((prev) => [...prev, { id, x, y, seed, hostClassName: req.hostClassName, hostStyle: req.hostStyle }])

      window.setTimeout(() => finishFx(id), cardConsumeTotalMs() + 48)
    },
    [stageLayerRef, finishFx],
  )

  const handleFxComplete = useCallback(
    (fxId: number) => {
      finishFx(fxId)
    },
    [finishFx],
  )

  return (
    <CardConsumeContext.Provider value={{ playCardConsume }}>
      {children}
      <div className="cardConsumeFxLayer" aria-hidden>
        {fxList.map((fx) => (
          <div
            key={fx.id}
            className={['cardConsumeHost', fx.hostClassName].filter(Boolean).join(' ')}
            style={{ left: `${fx.x}px`, top: `${fx.y}px`, ...(fx.hostStyle ?? {}) }}
          >
            <CardConsumeFx fxId={fx.id} seed={fx.seed} onComplete={handleFxComplete} />
          </div>
        ))}
      </div>
    </CardConsumeContext.Provider>
  )
}

export function useCardConsume(): CardConsumeContextValue {
  const ctx = useContext(CardConsumeContext)
  if (!ctx) throw new Error('useCardConsume must be used within CardConsumeProvider')
  return ctx
}
