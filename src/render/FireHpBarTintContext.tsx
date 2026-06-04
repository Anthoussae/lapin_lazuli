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
import type { EnemyInstanceId } from '../core/types/ids'
import type { GameState } from '../core/types/state'
import { consumeDebugEventBatch } from './debugEventBatch'
import { fireHpBarTintDurationMs } from './fireHpBarTintConfig'

export type FireHpBarTintUnit = 'PLAYER' | EnemyInstanceId

type FireHpBarTintContextValue = Readonly<{
  isFireTinted: (unit: FireHpBarTintUnit) => boolean
}>

const FireHpBarTintContext = createContext<FireHpBarTintContextValue | null>(null)

const FIRE_DAMAGE_RECEIVED_RE = /^FIRE_DAMAGE_RECEIVED (PLAYER|\S+) ([01])$/

function unitKey(unit: FireHpBarTintUnit): string {
  return unit === 'PLAYER' ? 'player' : `enemy:${unit}`
}

function parseFireHpLossLine(line: string): FireHpBarTintUnit | null {
  const m = FIRE_DAMAGE_RECEIVED_RE.exec(line)
  if (!m || m[2] !== '1') return null
  return m[1] === 'PLAYER' ? 'PLAYER' : (m[1] as EnemyInstanceId)
}

export function FireHpBarTintProvider(
  props: Readonly<{ state: GameState; children: ReactNode }>,
) {
  const { state, children } = props
  const [tinted, setTinted] = useState<ReadonlySet<string>>(() => new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastBatchIdRef = useRef(0)

  const startTint = useCallback((unit: FireHpBarTintUnit) => {
    const key = unitKey(unit)
    const existing = timersRef.current.get(key)
    if (existing != null) clearTimeout(existing)

    setTinted((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })

    const durationMs = fireHpBarTintDurationMs()
    const timer = setTimeout(() => {
      timersRef.current.delete(key)
      setTinted((prev) => {
        if (!prev.has(key)) return prev
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }, durationMs + 40)
    timersRef.current.set(key, timer)
  }, [])

  useEffect(
    () => () => {
      for (const t of timersRef.current.values()) clearTimeout(t)
      timersRef.current.clear()
    },
    [],
  )

  useEffect(() => {
    const { lastEvents, eventBatchId } = state.ui.debug
    consumeDebugEventBatch(
      eventBatchId,
      lastEvents,
      lastBatchIdRef,
      (line) => {
        const unit = parseFireHpLossLine(line)
        if (unit) startTint(unit)
      },
      { dedupeLines: false },
    )
  }, [state.ui.debug.eventBatchId, state.ui.debug.lastEvents, startTint])

  const value = useMemo<FireHpBarTintContextValue>(
    () => ({
      isFireTinted: (unit) => tinted.has(unitKey(unit)),
    }),
    [tinted],
  )

  return <FireHpBarTintContext.Provider value={value}>{children}</FireHpBarTintContext.Provider>
}

export function useFireHpBarTint(unit: FireHpBarTintUnit): boolean {
  const ctx = useContext(FireHpBarTintContext)
  return ctx?.isFireTinted(unit) ?? false
}
