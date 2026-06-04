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
import type { EnemyInstanceId, EnchantmentId } from '../core/types/ids'
import type { EnchantmentSpriteOverlayId } from '../core/types/enchantments'
import type { GameState } from '../core/types/state'
import { consumeDebugEventBatch } from './debugEventBatch'
import { poisonEnchantmentTriggerFxTotalMs } from './poisonEnchantmentTriggerFxConfig'

export type EnchantmentSpriteTriggerTarget =
  | Readonly<{ kind: 'player' }>
  | Readonly<{ kind: 'enemy'; enemyInstanceId: EnemyInstanceId }>

type ActivePulse = Readonly<{ key: number }>

type EnchantmentSpriteTriggerFxContextValue = Readonly<{
  getPulse: (target: EnchantmentSpriteTriggerTarget, sprite: EnchantmentSpriteOverlayId) => ActivePulse | null
}>

const EnchantmentSpriteTriggerFxContext = createContext<EnchantmentSpriteTriggerFxContextValue | null>(null)

const ENCHANTMENT_TRIGGER_RE = /^ENCHANTMENT (\w+) (PLAYER|\S+)$/

function targetKey(target: EnchantmentSpriteTriggerTarget): string {
  return target.kind === 'player' ? 'player' : `enemy:${target.enemyInstanceId}`
}

function pulseKey(target: EnchantmentSpriteTriggerTarget, sprite: EnchantmentSpriteOverlayId): string {
  return `${targetKey(target)}:${sprite}`
}

function parseEnchantmentTriggeredEvent(
  line: string,
): { enchantmentId: EnchantmentId; unit: 'PLAYER' | EnemyInstanceId } | null {
  const m = ENCHANTMENT_TRIGGER_RE.exec(line)
  if (!m) return null
  return { enchantmentId: m[1] as EnchantmentId, unit: m[2] === 'PLAYER' ? 'PLAYER' : (m[2] as EnemyInstanceId) }
}

function spriteForEnchantmentId(enchantmentId: EnchantmentId): EnchantmentSpriteOverlayId | null {
  if (enchantmentId === 'POISON') return 'POISON'
  return null
}

function targetForUnit(unit: 'PLAYER' | EnemyInstanceId): EnchantmentSpriteTriggerTarget {
  return unit === 'PLAYER' ? { kind: 'player' } : { kind: 'enemy', enemyInstanceId: unit }
}

export function EnchantmentSpriteTriggerFxProvider(
  props: Readonly<{ state: GameState; children: ReactNode }>,
) {
  const { state, children } = props
  const [pulses, setPulses] = useState<ReadonlyMap<string, ActivePulse>>(() => new Map())
  const pulseKeyRef = useRef(0)
  const lastBatchIdRef = useRef(0)

  const playPulse = useCallback((key: string) => {
    pulseKeyRef.current += 1
    const animKey = pulseKeyRef.current
    setPulses((prev) => {
      const next = new Map(prev)
      next.set(key, { key: animKey })
      return next
    })
    window.setTimeout(() => {
      setPulses((current) => {
        const next = new Map(current)
        const cur = next.get(key)
        if (cur?.key === animKey) next.delete(key)
        return next
      })
    }, poisonEnchantmentTriggerFxTotalMs() + 40)
  }, [])

  useEffect(() => {
    const { lastEvents, eventBatchId } = state.ui.debug
    consumeDebugEventBatch(
      eventBatchId,
      lastEvents,
      lastBatchIdRef,
      (line) => {
        const parsed = parseEnchantmentTriggeredEvent(line)
        if (!parsed) return
        const sprite = spriteForEnchantmentId(parsed.enchantmentId)
        if (!sprite) return
        playPulse(pulseKey(targetForUnit(parsed.unit), sprite))
      },
      { dedupeLines: false },
    )
  }, [state.ui.debug.eventBatchId, state.ui.debug.lastEvents, playPulse])

  const value = useMemo<EnchantmentSpriteTriggerFxContextValue>(
    () => ({
      getPulse: (target, sprite) => pulses.get(pulseKey(target, sprite)) ?? null,
    }),
    [pulses],
  )

  return (
    <EnchantmentSpriteTriggerFxContext.Provider value={value}>
      {children}
    </EnchantmentSpriteTriggerFxContext.Provider>
  )
}

export function useEnchantmentSpriteTriggerPulse(
  target: EnchantmentSpriteTriggerTarget | null,
  sprite: EnchantmentSpriteOverlayId,
): { className: string; key: number } {
  const ctx = useContext(EnchantmentSpriteTriggerFxContext)
  const pulse = target ? (ctx?.getPulse(target, sprite) ?? null) : null
  return {
    className: pulse ? 'enchantmentSpriteOverlay__idle--triggerPulse' : '',
    key: pulse?.key ?? 0,
  }
}
