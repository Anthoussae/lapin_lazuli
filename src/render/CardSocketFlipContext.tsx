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
import type { CardTravelPayload } from './CardTravelContext'
import { cardSocketFlipTotalMs } from './cardSocketFlipConfig'
import { CardSocketFlipFx } from './primitives/CardSocketFlipFx'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveSocketFlip = Readonly<{
  id: number
  x: number
  y: number
  cardBefore: CardTravelPayload
  cardAfter: CardTravelPayload
}>

export type CardSocketFlipRequest = Readonly<{
  cardInstanceId: CardInstanceId
  sourceEl: HTMLElement
  cardBefore: CardTravelPayload
  cardAfter: CardTravelPayload
  onComplete?: () => void
}>

type CardSocketFlipContextValue = Readonly<{
  playCardSocketFlip: (req: CardSocketFlipRequest) => void
  /** Card hidden in the list while its flip overlay runs. */
  animatingCardInstanceId: CardInstanceId | null
  isSocketFlipPlaying: boolean
}>

const CardSocketFlipContext = createContext<CardSocketFlipContextValue | null>(null)

export function CardSocketFlipProvider(props: Readonly<{ children: ReactNode }>) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const nextIdRef = useRef(0)
  const onCompleteByIdRef = useRef(new Map<number, () => void>())
  const animatingCardIdRef = useRef<CardInstanceId | null>(null)
  const [fxList, setFxList] = useState<ReadonlyArray<ActiveSocketFlip>>([])
  const [animatingCardInstanceId, setAnimatingCardInstanceId] = useState<CardInstanceId | null>(null)

  const finishFx = useCallback((fxId: number) => {
    setFxList((prev) => {
      const next = prev.filter((f) => f.id !== fxId)
      if (next.length === 0) {
        animatingCardIdRef.current = null
        setAnimatingCardInstanceId(null)
      }
      return next
    })
    const done = onCompleteByIdRef.current.get(fxId)
    onCompleteByIdRef.current.delete(fxId)
    done?.()
  }, [])

  const playCardSocketFlip = useCallback(
    (req: CardSocketFlipRequest) => {
      if (animatingCardIdRef.current) {
        req.onComplete?.()
        return
      }

      const stageLayer = stageLayerRef.current
      if (!stageLayer) {
        req.onComplete?.()
        return
      }

      const fromViewport = centerOf(cardViewportRect(req.sourceEl))
      if (!fromViewport) {
        req.onComplete?.()
        return
      }

      const { x, y } = viewportPointRelativeTo(stageLayer, fromViewport.x, fromViewport.y)
      const id = ++nextIdRef.current
      animatingCardIdRef.current = req.cardInstanceId
      setAnimatingCardInstanceId(req.cardInstanceId)
      if (req.onComplete) onCompleteByIdRef.current.set(id, req.onComplete)
      setFxList([{ id, x, y, cardBefore: req.cardBefore, cardAfter: req.cardAfter }])

      window.setTimeout(() => finishFx(id), cardSocketFlipTotalMs() + 64)
    },
    [stageLayerRef, finishFx],
  )

  return (
    <CardSocketFlipContext.Provider
      value={{
        playCardSocketFlip,
        animatingCardInstanceId,
        isSocketFlipPlaying: animatingCardInstanceId != null,
      }}
    >
      {children}
      <div className="cardSocketFlipFxLayer" aria-hidden>
        {fxList.map((fx) => (
          <div
            key={fx.id}
            className="cardSocketFlipHost"
            style={{ left: `${fx.x}px`, top: `${fx.y}px` }}
          >
            <CardSocketFlipFx
              fxId={fx.id}
              cardBefore={fx.cardBefore}
              cardAfter={fx.cardAfter}
              onComplete={finishFx}
            />
          </div>
        ))}
      </div>
    </CardSocketFlipContext.Provider>
  )
}

export function useCardSocketFlip(): CardSocketFlipContextValue {
  const ctx = useContext(CardSocketFlipContext)
  if (!ctx) throw new Error('useCardSocketFlip must be used within CardSocketFlipProvider')
  return ctx
}
