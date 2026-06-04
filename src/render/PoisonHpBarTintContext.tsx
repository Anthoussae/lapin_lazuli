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
import { poisonHpBarTintDurationMs } from './poisonHpBarTintConfig'

export type PoisonHpBarTintUnit = 'PLAYER' | EnemyInstanceId

type PoisonHpBarTintContextValue = Readonly<{
  isPoisonTinted: (unit: PoisonHpBarTintUnit) => boolean
}>

const PoisonHpBarTintContext = createContext<PoisonHpBarTintContextValue | null>(null)

const ENCHANTMENT_POISON_TRIGGER_RE = /^ENCHANTMENT POISON (PLAYER|\S+)$/
const POISON_CARD_HP_LOSS_RE = /^POISON_CARD_HP_LOSS (PLAYER|\S+) \S+$/

function unitKey(unit: PoisonHpBarTintUnit): string {
  return unit === 'PLAYER' ? 'player' : `enemy:${unit}`
}

function parsePoisonHpLossLine(line: string): PoisonHpBarTintUnit | null {
  const ench = ENCHANTMENT_POISON_TRIGGER_RE.exec(line)
  if (ench) return ench[1] === 'PLAYER' ? 'PLAYER' : (ench[1] as EnemyInstanceId)
  const card = POISON_CARD_HP_LOSS_RE.exec(line)
  if (card) return card[1] === 'PLAYER' ? 'PLAYER' : (card[1] as EnemyInstanceId)
  return null
}

export function PoisonHpBarTintProvider(
  props: Readonly<{ state: GameState; children: ReactNode }>,
) {
  const { state, children } = props
  const [tinted, setTinted] = useState<ReadonlySet<string>>(() => new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastBatchIdRef = useRef(0)

  const startTint = useCallback((unit: PoisonHpBarTintUnit) => {
    const key = unitKey(unit)
    const existing = timersRef.current.get(key)
    if (existing != null) clearTimeout(existing)

    setTinted((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })

    const durationMs = poisonHpBarTintDurationMs()
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
        const unit = parsePoisonHpLossLine(line)
        if (unit) startTint(unit)
      },
      { dedupeLines: false },
    )
  }, [state.ui.debug.eventBatchId, state.ui.debug.lastEvents, startTint])

  const value = useMemo<PoisonHpBarTintContextValue>(
    () => ({
      isPoisonTinted: (unit) => tinted.has(unitKey(unit)),
    }),
    [tinted],
  )

  return <PoisonHpBarTintContext.Provider value={value}>{children}</PoisonHpBarTintContext.Provider>
}

export function usePoisonHpBarTint(unit: PoisonHpBarTintUnit): boolean {
  const ctx = useContext(PoisonHpBarTintContext)
  return ctx?.isPoisonTinted(unit) ?? false
}
