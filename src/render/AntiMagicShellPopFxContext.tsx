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
import { antiMagicShellPopFxDurationMs, antiMagicShellPopFxOffsetX, antiMagicShellPopFxOffsetY } from './antiMagicShellPopFxConfig'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveAntiMagicShellPop = Readonly<{
  id: number
  x: number
  y: number
}>

type AntiMagicShellPopFxContextValue = Readonly<{
  /** Stage-local pop burst centered on `anchor` (combat placeholder root). */
  playAntiMagicShellPopAt: (anchor: HTMLElement | null) => void
}>

const AntiMagicShellPopFxContext = createContext<AntiMagicShellPopFxContextValue | null>(null)

type AntiMagicShellPopFxProviderProps = Readonly<{
  children: ReactNode
}>

function antiMagicShellPopLog(message: string, data?: unknown) {
  // Intentional: mirrors bubble-pop logging (FX tends to be flaky).
  if (data !== undefined) console.log(`[anti-magic-shell-pop] ${message}`, data)
  else console.log(`[anti-magic-shell-pop] ${message}`)
}

export function AntiMagicShellPopFxProvider(props: AntiMagicShellPopFxProviderProps) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const nextIdRef = useRef(0)
  const [pops, setPops] = useState<ReadonlyArray<ActiveAntiMagicShellPop>>([])
  const lastCountRef = useRef<number>(-1)

  const dismissPop = useCallback((id: number) => {
    antiMagicShellPopLog('dismissPop()', { id })
    setPops((current) => current.filter((pop) => pop.id !== id))
  }, [])

  const playAntiMagicShellPopAt = useCallback(
    (anchor: HTMLElement | null) => {
      const stageLayer = stageLayerRef.current
      if (!stageLayer || !anchor) {
        antiMagicShellPopLog('playAntiMagicShellPopAt() early return (missing stageLayer or anchor)', {
          hasStageLayer: Boolean(stageLayer),
          hasAnchor: Boolean(anchor),
        })
        return
      }

      const center = centerOf(anchor.getBoundingClientRect())
      if (!center) {
        antiMagicShellPopLog('playAntiMagicShellPopAt() early return (no center from anchor rect)')
        return
      }

      const offsetX = antiMagicShellPopFxOffsetX()
      const offsetY = antiMagicShellPopFxOffsetY()
      const { x, y } = viewportPointRelativeTo(
        stageLayer,
        center.x + offsetX,
        center.y + offsetY,
      )
      const id = ++nextIdRef.current
      antiMagicShellPopLog('playAntiMagicShellPopAt() enqueue', {
        id,
        center,
        offsetX,
        offsetY,
        stageLocal: { x, y },
      })
      setPops((current) => [...current, { id, x, y }])

      const durationMs = antiMagicShellPopFxDurationMs()
      const holdMs = durationMs + 80
      antiMagicShellPopLog('playAntiMagicShellPopAt() schedule dismiss timeout', { id, durationMs, holdMs })
      window.setTimeout(() => dismissPop(id), holdMs)
    },
    [stageLayerRef, dismissPop],
  )

  const popSrc = enchantmentSpriteOverlaySrc('ANTI_MAGIC_SHELL', 'pop')

  useEffect(() => {
    ;(window as any).__antiMagicShellPopFxDebug = {
      playAt: (anchor: HTMLElement | null) => playAntiMagicShellPopAt(anchor),
      playAtSelector: (selector: string) => playAntiMagicShellPopAt(document.querySelector(selector)),
      get activePops() {
        return pops.length
      },
      popSrc,
    }
    return () => {
      try {
        delete (window as any).__antiMagicShellPopFxDebug
      } catch {
        ;(window as any).__antiMagicShellPopFxDebug = undefined
      }
    }
  }, [playAntiMagicShellPopAt, pops.length, popSrc])

  if (lastCountRef.current !== pops.length) {
    lastCountRef.current = pops.length
    antiMagicShellPopLog('active pops changed', { activePops: pops.length, popSrc })
  }

  return (
    <AntiMagicShellPopFxContext.Provider value={{ playAntiMagicShellPopAt }}>
      {children}
      <div className="antiMagicShellPopFxLayer" aria-hidden>
        {pops.map((pop) => (
          <div
            key={pop.id}
            className="antiMagicShellPopFxHost"
            style={{ left: `${pop.x}px`, top: `${pop.y}px` }}
          >
            <img
              className="antiMagicShellPopFx__img"
              src={popSrc}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget
                antiMagicShellPopLog('img load', {
                  id: pop.id,
                  src: img.currentSrc || img.src,
                  natural: { w: img.naturalWidth, h: img.naturalHeight },
                })
              }}
              onError={(e) => {
                const img = e.currentTarget
                antiMagicShellPopLog('img error', { id: pop.id, src: img.currentSrc || img.src })
              }}
              onAnimationStart={(e) => {
                antiMagicShellPopLog('animation start', { id: pop.id, animationName: e.animationName })
              }}
              onAnimationEnd={(e) => {
                antiMagicShellPopLog('animation end', { id: pop.id, animationName: e.animationName })
                if (!e.animationName.includes('enchantmentAntiMagicShellPopFade')) return
                dismissPop(pop.id)
              }}
            />
          </div>
        ))}
      </div>
    </AntiMagicShellPopFxContext.Provider>
  )
}

export function useAntiMagicShellPopFx(): AntiMagicShellPopFxContextValue {
  const ctx = useContext(AntiMagicShellPopFxContext)
  if (!ctx) throw new Error('useAntiMagicShellPopFx must be used within AntiMagicShellPopFxProvider')
  return ctx
}

export function useAntiMagicShellPopFxOptional(): AntiMagicShellPopFxContextValue | null {
  return useContext(AntiMagicShellPopFxContext)
}

