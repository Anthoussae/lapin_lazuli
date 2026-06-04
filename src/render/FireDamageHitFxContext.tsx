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
import { fireDamageEffectSprite } from './assets/displayImages'
import { centerOf } from './cardLayout'
import { consumeDebugEventBatch } from './debugEventBatch'
import { fireDamageHitFxTotalMs } from './fireDamageHitFxConfig'
import { useRelicTravel } from './RelicTravelContext'
import { readRootPxVar } from './relicTooltipPosition'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveFireDamageHit = Readonly<{
  id: number
  x: number
  y: number
}>

type FireDamageHitFxContextValue = Readonly<{
  registerPlayerAnchor: (el: HTMLElement | null) => void
  registerEnemyAnchor: (enemyInstanceId: EnemyInstanceId, el: HTMLElement | null) => void
}>

const FireDamageHitFxContext = createContext<FireDamageHitFxContextValue | null>(null)

const FIRE_DAMAGE_RECEIVED_RE = /^FIRE_DAMAGE_RECEIVED (PLAYER|\S+) [01]$/

function parseFireDamageReceivedEvent(line: string): { unit: 'PLAYER' | EnemyInstanceId } | null {
  const m = FIRE_DAMAGE_RECEIVED_RE.exec(line)
  if (!m) return null
  return { unit: m[1] === 'PLAYER' ? 'PLAYER' : (m[1] as EnemyInstanceId) }
}

function fireDamageHitOffsetX(): number {
  return readRootPxVar('--fire-damage-hit-offset-x')
}

function fireDamageHitOffsetY(): number {
  return readRootPxVar('--fire-damage-hit-offset-y')
}

export function FireDamageHitFxProvider(
  props: Readonly<{ state: GameState; children: ReactNode }>,
) {
  const { state, children } = props
  const { stageLayerRef } = useRelicTravel()
  const playerAnchorRef = useRef<HTMLElement | null>(null)
  const enemyAnchorsRef = useRef<Map<EnemyInstanceId, HTMLElement>>(new Map())
  const nextIdRef = useRef(0)
  const [hits, setHits] = useState<ReadonlyArray<ActiveFireDamageHit>>([])
  const lastBatchIdRef = useRef(0)

  const registerPlayerAnchor = useCallback((el: HTMLElement | null) => {
    playerAnchorRef.current = el
  }, [])

  const registerEnemyAnchor = useCallback((enemyInstanceId: EnemyInstanceId, el: HTMLElement | null) => {
    const map = enemyAnchorsRef.current
    if (!el) map.delete(enemyInstanceId)
    else map.set(enemyInstanceId, el)
  }, [])

  const dismissHit = useCallback((id: number) => {
    setHits((current) => current.filter((h) => h.id !== id))
  }, [])

  const playFireDamageHitAt = useCallback(
    (anchor: HTMLElement | null) => {
      const stageLayer = stageLayerRef.current
      if (!stageLayer || !anchor) return

      const center = centerOf(anchor.getBoundingClientRect())
      if (!center) return

      const { x, y } = viewportPointRelativeTo(
        stageLayer,
        center.x + fireDamageHitOffsetX(),
        center.y + fireDamageHitOffsetY(),
      )
      const id = ++nextIdRef.current
      setHits((current) => [...current, { id, x, y }])
      window.setTimeout(() => dismissHit(id), fireDamageHitFxTotalMs() + 80)
    },
    [stageLayerRef, dismissHit],
  )

  useEffect(() => {
    const { lastEvents, eventBatchId } = state.ui.debug
    consumeDebugEventBatch(eventBatchId, lastEvents, lastBatchIdRef, (line) => {
      const parsed = parseFireDamageReceivedEvent(line)
      if (!parsed) return
      const anchor =
        parsed.unit === 'PLAYER'
          ? playerAnchorRef.current
          : enemyAnchorsRef.current.get(parsed.unit) ?? null
      playFireDamageHitAt(anchor)
    })
  }, [state.ui.debug.eventBatchId, state.ui.debug.lastEvents, playFireDamageHitAt])

  const value = useMemo<FireDamageHitFxContextValue>(
    () => ({ registerPlayerAnchor, registerEnemyAnchor }),
    [registerPlayerAnchor, registerEnemyAnchor],
  )

  return (
    <FireDamageHitFxContext.Provider value={value}>
      {children}
      <div className="fireDamageHitFxLayer" aria-hidden>
        {hits.map((hit) => (
          <div
            key={hit.id}
            className="fireDamageHitFxHost"
            style={{ left: `${hit.x}px`, top: `${hit.y}px` }}
          >
            <img
              className="fireDamageHitFx__img"
              src={fireDamageEffectSprite}
              alt=""
              draggable={false}
              onAnimationEnd={(e) => {
                if (!e.animationName.includes('fireDamageHitFade')) return
                dismissHit(hit.id)
              }}
            />
          </div>
        ))}
      </div>
    </FireDamageHitFxContext.Provider>
  )
}

export function useFireDamageHitFxAnchors(): FireDamageHitFxContextValue {
  const ctx = useContext(FireDamageHitFxContext)
  if (!ctx) throw new Error('useFireDamageHitFxAnchors requires FireDamageHitFxProvider')
  return ctx
}
