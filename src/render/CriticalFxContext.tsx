import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import type { GameState } from '../core/types/state'
import type { CriticalFxVariant } from '../systems/cards/critical'
import { centerOf } from './cardLayout'
import {
  criticalFxDriftYPx,
  criticalFxFadeDurationMs,
  criticalFxOffsetX,
  criticalFxOffsetY,
  criticalFxTotalMs,
} from './criticalFxConfig'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveCriticalFloat = Readonly<{
  id: number
  x: number
  y: number
  variant: CriticalFxVariant
  multiplierPercent: number
}>

type CriticalShake = Readonly<{
  key: number
  variant: CriticalFxVariant
}>

type CriticalFxContextValue = Readonly<{
  enemyAnchorRef: MutableRefObject<HTMLElement | null>
  cauldronAnchorRef: MutableRefObject<HTMLElement | null>
  playerAnchorRef: MutableRefObject<HTMLElement | null>
  registerEnemyAnchor: (el: HTMLElement | null) => void
  registerCauldronAnchor: (el: HTMLElement | null) => void
  registerPlayerAnchor: (el: HTMLElement | null) => void
  getShake: (variant: CriticalFxVariant) => CriticalShake | null
}>

const CriticalFxContext = createContext<CriticalFxContextValue | null>(null)

const CRITICAL_HIT_RE = /^CRITICAL_HIT (\w+) (\d+)$/

function parseCriticalHitEvent(line: string): { variant: CriticalFxVariant; multiplierPercent: number } | null {
  const m = CRITICAL_HIT_RE.exec(line)
  if (!m) return null
  const variant = m[1] as CriticalFxVariant
  if (variant !== 'attack' && variant !== 'bunnies' && variant !== 'shield') return null
  return { variant, multiplierPercent: Number(m[2]) }
}

export function CriticalFxProvider(
  props: Readonly<{ state: GameState; children: ReactNode }>,
) {
  const { state, children } = props
  const { stageLayerRef } = useRelicTravel()
  const enemyAnchorRef = useRef<HTMLElement | null>(null)
  const cauldronAnchorRef = useRef<HTMLElement | null>(null)
  const playerAnchorRef = useRef<HTMLElement | null>(null)
  const nextIdRef = useRef(0)
  const shakeKeyRef = useRef(0)
  const [floats, setFloats] = useState<ReadonlyArray<ActiveCriticalFloat>>([])
  const [shake, setShake] = useState<CriticalShake | null>(null)
  const lastEventsRef = useRef('')
  const prevEventLinesRef = useRef<ReadonlySet<string>>(new Set())
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const registerEnemyAnchor = useCallback((el: HTMLElement | null) => {
    enemyAnchorRef.current = el
  }, [])
  const registerCauldronAnchor = useCallback((el: HTMLElement | null) => {
    cauldronAnchorRef.current = el
  }, [])
  const registerPlayerAnchor = useCallback((el: HTMLElement | null) => {
    playerAnchorRef.current = el
  }, [])

  const dismissFloat = useCallback((id: number) => {
    setFloats((current) => current.filter((f) => f.id !== id))
  }, [])

  const playCriticalFx = useCallback(
    (variant: CriticalFxVariant, multiplierPercent: number) => {
      const stageLayer = stageLayerRef.current
      const anchor =
        variant === 'attack'
          ? enemyAnchorRef.current
          : variant === 'bunnies'
            ? cauldronAnchorRef.current
            : playerAnchorRef.current
      if (!stageLayer || !anchor) return

      const center = centerOf(anchor.getBoundingClientRect())
      if (!center) return

      const { x, y } = viewportPointRelativeTo(
        stageLayer,
        center.x + criticalFxOffsetX(),
        center.y + criticalFxOffsetY(),
      )
      const id = ++nextIdRef.current
      setFloats((current) => [...current, { id, x, y, variant, multiplierPercent }])

      shakeKeyRef.current += 1
      setShake({ key: shakeKeyRef.current, variant })

      const fadeMs = criticalFxFadeDurationMs()
      window.setTimeout(() => dismissFloat(id), fadeMs + 40)

      if (clearTimerRef.current != null) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(() => {
        setShake(null)
        clearTimerRef.current = null
      }, criticalFxTotalMs())
    },
    [stageLayerRef, dismissFloat],
  )

  useEffect(
    () => () => {
      if (clearTimerRef.current != null) clearTimeout(clearTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    const lastEvents = state.ui.debug.lastEvents
    const eventsKey = lastEvents.join('\n')
    if (eventsKey === lastEventsRef.current) return
    lastEventsRef.current = eventsKey

    if (!lastEvents.length) {
      prevEventLinesRef.current = new Set()
      return
    }

    const prevLines = prevEventLinesRef.current
    for (const line of lastEvents) {
      if (prevLines.has(line)) continue
      const parsed = parseCriticalHitEvent(line)
      if (parsed) playCriticalFx(parsed.variant, parsed.multiplierPercent)
    }
    prevEventLinesRef.current = new Set(lastEvents)
  }, [state.ui.debug.lastEvents, playCriticalFx])

  const value = useMemo<CriticalFxContextValue>(
    () => ({
      enemyAnchorRef,
      cauldronAnchorRef,
      playerAnchorRef,
      registerEnemyAnchor,
      registerCauldronAnchor,
      registerPlayerAnchor,
      getShake: (variant) => (shake?.variant === variant ? shake : null),
    }),
    [registerEnemyAnchor, registerCauldronAnchor, registerPlayerAnchor, shake],
  )

  const driftY = criticalFxDriftYPx()
  const fadeMs = criticalFxFadeDurationMs()

  return (
    <CriticalFxContext.Provider value={value}>
      {children}
      <div className="criticalFxLayer" aria-hidden>
        {floats.map((f) => (
          <div
            key={f.id}
            className={`criticalFxFloat criticalFxFloat--${f.variant}`}
            style={{
              left: `${f.x}px`,
              top: `${f.y}px`,
              ['--critical-fx-drift-y' as string]: `${driftY}px`,
              ['--duration-critical-fx-fade' as string]: `${fadeMs}ms`,
            }}
          >
            {f.multiplierPercent}%
          </div>
        ))}
      </div>
    </CriticalFxContext.Provider>
  )
}

export function useCriticalFxAnchors(): CriticalFxContextValue {
  const ctx = useContext(CriticalFxContext)
  if (!ctx) throw new Error('useCriticalFxAnchors requires CriticalFxProvider')
  return ctx
}

export function useCriticalFxShakeClass(variant: CriticalFxVariant): { className: string; key: number } {
  const ctx = useContext(CriticalFxContext)
  const shake = ctx?.getShake(variant) ?? null
  return {
    className: shake ? `criticalFxShake criticalFxShake--${variant}` : '',
    key: shake?.key ?? 0,
  }
}
