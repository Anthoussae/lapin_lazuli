import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { centerOf } from './cardLayout'
import { enchantmentSpriteOverlaySrc } from './enchantmentSpriteImages'
import { bubblePopFxDurationMs, bubblePopFxOffsetX, bubblePopFxOffsetY } from './bubblePopFxConfig'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveBubblePop = Readonly<{
  id: number
  x: number
  y: number
}>

type BubblePopFxContextValue = Readonly<{
  /** Stage-local pop burst centered on `anchor` (combat placeholder root). */
  playBubblePopAt: (anchor: HTMLElement | null) => void
}>

const BubblePopFxContext = createContext<BubblePopFxContextValue | null>(null)

type BubblePopFxProviderProps = Readonly<{
  children: ReactNode
}>

function bubblePopLog(message: string, data?: unknown) {
  // Intentional: this FX has been flaky; always log until fixed.
  if (data !== undefined) console.log(`[bubble-pop] ${message}`, data)
  else console.log(`[bubble-pop] ${message}`)
}

export function BubblePopFxProvider(props: BubblePopFxProviderProps) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const nextIdRef = useRef(0)
  const [pops, setPops] = useState<ReadonlyArray<ActiveBubblePop>>([])
  const lastCountRef = useRef<number>(-1)

  const dismissPop = useCallback((id: number) => {
    bubblePopLog('dismissPop()', { id })
    setPops((current) => current.filter((pop) => pop.id !== id))
  }, [])

  const playBubblePopAt = useCallback(
    (anchor: HTMLElement | null) => {
      const stageLayer = stageLayerRef.current
      if (!stageLayer || !anchor) {
        bubblePopLog('playBubblePopAt() early return (missing stageLayer or anchor)', {
          hasStageLayer: Boolean(stageLayer),
          hasAnchor: Boolean(anchor),
        })
        return
      }

      const center = centerOf(anchor.getBoundingClientRect())
      if (!center) {
        bubblePopLog('playBubblePopAt() early return (no center from anchor rect)')
        return
      }

      const offsetX = bubblePopFxOffsetX()
      const offsetY = bubblePopFxOffsetY()
      const { x, y } = viewportPointRelativeTo(
        stageLayer,
        center.x + offsetX,
        center.y + offsetY,
      )
      const id = ++nextIdRef.current
      bubblePopLog('playBubblePopAt() enqueue', {
        id,
        center,
        offsetX,
        offsetY,
        stageLocal: { x, y },
      })
      setPops((current) => [...current, { id, x, y }])

      const durationMs = bubblePopFxDurationMs()
      const holdMs = durationMs + 80
      bubblePopLog('playBubblePopAt() schedule dismiss timeout', { id, durationMs, holdMs })
      window.setTimeout(() => dismissPop(id), holdMs)
    },
    [stageLayerRef, dismissPop],
  )

  const popSrc = enchantmentSpriteOverlaySrc('BUBBLE', 'pop')

  useEffect(() => {
    ;(window as any).__bubblePopFxDebug = {
      playAt: (anchor: HTMLElement | null) => playBubblePopAt(anchor),
      playAtSelector: (selector: string) => playBubblePopAt(document.querySelector(selector)),
      get activePops() {
        return pops.length
      },
      popSrc,
    }
    return () => {
      try {
        delete (window as any).__bubblePopFxDebug
      } catch {
        ;(window as any).__bubblePopFxDebug = undefined
      }
    }
  }, [playBubblePopAt, pops.length, popSrc])

  // Only log when pop count changes (render spam was hiding the signal).
  if (lastCountRef.current !== pops.length) {
    lastCountRef.current = pops.length
    bubblePopLog('active pops changed', { activePops: pops.length, popSrc })
  }

  return (
    <BubblePopFxContext.Provider value={{ playBubblePopAt }}>
      {children}
      <div className="bubblePopFxLayer" aria-hidden>
        {pops.map((pop) => (
          <div
            key={pop.id}
            className="bubblePopFxHost"
            style={{ left: `${pop.x}px`, top: `${pop.y}px` }}
          >
            <img
              className="bubblePopFx__img"
              src={popSrc}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget
                bubblePopLog('img load', {
                  id: pop.id,
                  src: img.currentSrc || img.src,
                  natural: { w: img.naturalWidth, h: img.naturalHeight },
                })
              }}
              onError={(e) => {
                const img = e.currentTarget
                bubblePopLog('img error', { id: pop.id, src: img.currentSrc || img.src })
              }}
              onAnimationStart={(e) => {
                bubblePopLog('animation start', { id: pop.id, animationName: e.animationName })
              }}
              onAnimationEnd={(e) => {
                bubblePopLog('animation end', { id: pop.id, animationName: e.animationName })
                if (!e.animationName.includes('enchantmentBubblePopFade')) return
                dismissPop(pop.id)
              }}
            />
          </div>
        ))}
      </div>
    </BubblePopFxContext.Provider>
  )
}

export function useBubblePopFx(): BubblePopFxContextValue {
  const ctx = useContext(BubblePopFxContext)
  if (!ctx) throw new Error('useBubblePopFx must be used within BubblePopFxProvider')
  return ctx
}

export function useBubblePopFxOptional(): BubblePopFxContextValue | null {
  return useContext(BubblePopFxContext)
}
