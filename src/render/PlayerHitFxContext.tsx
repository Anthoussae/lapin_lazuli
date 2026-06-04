import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { GameState } from '../core/types/state'
import { consumeDebugEventBatch } from './debugEventBatch'
import { playerHitFxTotalMs } from './playerHitFxConfig'

type PlayerHitFxPulse = Readonly<{
  key: number
}>

type PlayerHitFxContextValue = Readonly<{
  getPulse: () => PlayerHitFxPulse | null
}>

const PlayerHitFxContext = createContext<PlayerHitFxContextValue | null>(null)

const PLAYER_UNBLOCKED_DAMAGE_RE = /^PLAYER_UNBLOCKED_DAMAGE ENEMY (\d+)$/

function isPlayerUnblockedDamageFromEnemy(line: string): boolean {
  return PLAYER_UNBLOCKED_DAMAGE_RE.test(line)
}

export function PlayerHitFxProvider(props: Readonly<{ state: GameState; children: ReactNode }>) {
  const { state, children } = props
  const pulseKeyRef = useRef(0)
  const [pulse, setPulse] = useState<PlayerHitFxPulse | null>(null)
  const lastBatchIdRef = useRef(0)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playPlayerHitFx = useCallback(() => {
    pulseKeyRef.current += 1
    setPulse({ key: pulseKeyRef.current })

    if (clearTimerRef.current != null) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => {
      setPulse(null)
      clearTimerRef.current = null
    }, playerHitFxTotalMs())
  }, [])

  useEffect(
    () => () => {
      if (clearTimerRef.current != null) clearTimeout(clearTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    const { lastEvents, eventBatchId } = state.ui.debug
    consumeDebugEventBatch(eventBatchId, lastEvents, lastBatchIdRef, (line) => {
      if (isPlayerUnblockedDamageFromEnemy(line)) playPlayerHitFx()
    })
  }, [state.ui.debug.eventBatchId, state.ui.debug.lastEvents, playPlayerHitFx])

  const value = useMemo<PlayerHitFxContextValue>(() => ({ getPulse: () => pulse }), [pulse])

  return <PlayerHitFxContext.Provider value={value}>{children}</PlayerHitFxContext.Provider>
}

export function usePlayerHitFxClass(): { className: string; key: number } {
  const ctx = useContext(PlayerHitFxContext)
  const active = ctx?.getPulse() ?? null
  return {
    className: active ? 'playerHitFx' : '',
    key: active?.key ?? 0,
  }
}
