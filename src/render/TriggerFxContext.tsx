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
import type { EnemyBoonId } from '../data/enemyBoons'
import type { RelicId } from '../core/types/ids'
import type { EnemyInstanceId } from '../core/types/ids'
import type { GameState } from '../core/types/state'
import { triggerFxTotalMs } from './triggerFxConfig'
import {
  flashesForBoonTrigger,
  flashesForRelicTrigger,
  triggerFxAnchorKey,
  type TriggerFxAnchor,
  type TriggerFxRole,
} from './triggerFxFromRelic'

type ActiveFlash = Readonly<{
  role: TriggerFxRole
  key: number
}>

type TriggerFxContextValue = Readonly<{
  getFlash: (anchor: TriggerFxAnchor) => ActiveFlash | null
}>

const TriggerFxContext = createContext<TriggerFxContextValue | null>(null)

const RELIC_EVENT_RE = /^RELIC (\w+) \((.+)\)$/
const BOON_EVENT_RE = /^BOON (\S+) (\w+) \((.+)\)$/

function parseRelicTriggeredEvent(line: string): { relicId: RelicId; triggerId: string } | null {
  const m = RELIC_EVENT_RE.exec(line)
  if (!m) return null
  return { relicId: m[1] as RelicId, triggerId: m[2]! }
}

function parseBoonTriggeredEvent(
  line: string,
): { enemyId: EnemyInstanceId; boonId: EnemyBoonId; triggerId: string } | null {
  const m = BOON_EVENT_RE.exec(line)
  if (!m) return null
  return { enemyId: m[1]!, boonId: m[2] as EnemyBoonId, triggerId: m[3]! }
}

export function TriggerFxProvider(
  props: Readonly<{ state: GameState; children: ReactNode }>,
) {
  const { state, children } = props
  const [flashes, setFlashes] = useState<ReadonlyMap<string, ActiveFlash>>(() => new Map())
  const flashKeyRef = useRef(0)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEventsRef = useRef('')

  const playFlashes = useCallback((nextFlashes: ReadonlyArray<{ anchor: TriggerFxAnchor; role: TriggerFxRole }>) => {
    if (!nextFlashes.length) return
    flashKeyRef.current += 1
    const key = flashKeyRef.current
    setFlashes((prev) => {
      const map = new Map(prev)
      for (const f of nextFlashes) {
        map.set(triggerFxAnchorKey(f.anchor), { role: f.role, key })
      }
      return map
    })
    if (clearTimerRef.current != null) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => {
      setFlashes(new Map())
      clearTimerRef.current = null
    }, triggerFxTotalMs())
  }, [])

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

    for (const line of lastEvents) {
      const boonParsed = parseBoonTriggeredEvent(line)
      if (boonParsed && state.combat) {
        const plan = flashesForBoonTrigger(
          state.combat.enemies,
          boonParsed.enemyId,
          boonParsed.boonId,
          boonParsed.triggerId,
        )
        if (plan) playFlashes(plan)
        continue
      }

      const parsed = parseRelicTriggeredEvent(line)
      if (!parsed) continue
      const plan = flashesForRelicTrigger(state.player.relics, parsed.relicId, parsed.triggerId)
      if (plan) playFlashes(plan)
    }
  }, [state.ui.debug.lastEvents, state.player.relics, state.combat, playFlashes])

  const value = useMemo<TriggerFxContextValue>(
    () => ({
      getFlash: (anchor) => flashes.get(triggerFxAnchorKey(anchor)) ?? null,
    }),
    [flashes],
  )

  return <TriggerFxContext.Provider value={value}>{children}</TriggerFxContext.Provider>
}

export function useTriggerFxArtProps(anchor: TriggerFxAnchor): { className: string; key: number } {
  const ctx = useContext(TriggerFxContext)
  const flash = ctx?.getFlash(anchor) ?? null
  return {
    className: flash ? `triggerFx--${flash.role}` : '',
    key: flash?.key ?? 0,
  }
}
