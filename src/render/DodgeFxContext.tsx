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
import { centerOf } from './cardLayout'
import {
  DODGE_FX_LABEL,
  dodgeFxDriftYPx,
  dodgeFxFadeDurationMs,
  dodgeFxOffsetX,
  dodgeFxOffsetY,
  dodgeFxTotalMs,
} from './dodgeFxConfig'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

const PLAYER_DODGED_LINE = 'PLAYER_DODGED'

type ActiveDodgeFloat = Readonly<{
  id: number
  x: number
  y: number
}>

type DodgeWiggle = Readonly<{
  key: number
}>

type DodgeFxContextValue = Readonly<{
  playerAnchorRef: MutableRefObject<HTMLElement | null>
  registerPlayerAnchor: (el: HTMLElement | null) => void
  getWiggle: () => DodgeWiggle | null
}>

const DodgeFxContext = createContext<DodgeFxContextValue | null>(null)

export function DodgeFxProvider(props: Readonly<{ state: GameState; children: ReactNode }>) {
  const { state, children } = props
  const { stageLayerRef } = useRelicTravel()
  const playerAnchorRef = useRef<HTMLElement | null>(null)
  const nextIdRef = useRef(0)
  const wiggleKeyRef = useRef(0)
  const [floats, setFloats] = useState<ReadonlyArray<ActiveDodgeFloat>>([])
  const [wiggle, setWiggle] = useState<DodgeWiggle | null>(null)
  const lastEventsRef = useRef('')
  const prevEventLinesRef = useRef<ReadonlySet<string>>(new Set())
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const registerPlayerAnchor = useCallback((el: HTMLElement | null) => {
    playerAnchorRef.current = el
  }, [])

  const dismissFloat = useCallback((id: number) => {
    setFloats((current) => current.filter((f) => f.id !== id))
  }, [])

  const playDodgeFx = useCallback(() => {
    const stageLayer = stageLayerRef.current
    const anchor = playerAnchorRef.current
    if (!stageLayer || !anchor) return

    const center = centerOf(anchor.getBoundingClientRect())
    if (!center) return

    const { x, y } = viewportPointRelativeTo(
      stageLayer,
      center.x + dodgeFxOffsetX(),
      center.y + dodgeFxOffsetY(),
    )
    const id = ++nextIdRef.current
    setFloats((current) => [...current, { id, x, y }])

    wiggleKeyRef.current += 1
    setWiggle({ key: wiggleKeyRef.current })

    const fadeMs = dodgeFxFadeDurationMs()
    window.setTimeout(() => dismissFloat(id), fadeMs + 40)

    if (clearTimerRef.current != null) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => {
      setWiggle(null)
      clearTimerRef.current = null
    }, dodgeFxTotalMs())
  }, [stageLayerRef, dismissFloat])

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
      if (line === PLAYER_DODGED_LINE) playDodgeFx()
    }
    prevEventLinesRef.current = new Set(lastEvents)
  }, [state.ui.debug.lastEvents, playDodgeFx])

  const value = useMemo<DodgeFxContextValue>(
    () => ({
      playerAnchorRef,
      registerPlayerAnchor,
      getWiggle: () => wiggle,
    }),
    [registerPlayerAnchor, wiggle],
  )

  const driftY = dodgeFxDriftYPx()
  const fadeMs = dodgeFxFadeDurationMs()

  return (
    <DodgeFxContext.Provider value={value}>
      {children}
      <div className="dodgeFxLayer" aria-hidden>
        {floats.map((f) => (
          <div
            key={f.id}
            className="dodgeFxFloat"
            style={{
              left: `${f.x}px`,
              top: `${f.y}px`,
              ['--dodge-fx-drift-y' as string]: `${driftY}px`,
              ['--duration-dodge-fx-fade' as string]: `${fadeMs}ms`,
            }}
          >
            {DODGE_FX_LABEL}
          </div>
        ))}
      </div>
    </DodgeFxContext.Provider>
  )
}

export function useDodgeFxAnchors(): DodgeFxContextValue {
  const ctx = useContext(DodgeFxContext)
  if (!ctx) throw new Error('useDodgeFxAnchors requires DodgeFxProvider')
  return ctx
}

export function useDodgeFxWiggleClass(): { className: string; key: number } {
  const ctx = useContext(DodgeFxContext)
  const active = ctx?.getWiggle() ?? null
  return {
    className: active ? 'dodgeFxWiggle' : '',
    key: active?.key ?? 0,
  }
}
