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
import { centerOf } from './cardLayout'
import { enchantmentSpriteOverlaySrc } from './enchantmentSpriteImages'
import { consumeDebugEventBatch } from './debugEventBatch'
import { poisonCardHitFxTotalMs } from './poisonCardHitFxConfig'
import { useRelicTravel } from './RelicTravelContext'
import { readRootPxVar } from './relicTooltipPosition'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActivePoisonCardHit = Readonly<{
  id: number
  x: number
  y: number
}>

type PoisonCardHitFxContextValue = Readonly<{
  registerPlayerAnchor: (el: HTMLElement | null) => void
  registerEnemyAnchor: (enemyInstanceId: EnemyInstanceId, el: HTMLElement | null) => void
}>

const PoisonCardHitFxContext = createContext<PoisonCardHitFxContextValue | null>(null)

const POISON_CARD_HP_LOSS_RE = /^POISON_CARD_HP_LOSS (PLAYER|\S+) \S+$/

function parsePoisonCardHpLossEvent(line: string): { unit: 'PLAYER' | EnemyInstanceId } | null {
  const m = POISON_CARD_HP_LOSS_RE.exec(line)
  if (!m) return null
  return { unit: m[1] === 'PLAYER' ? 'PLAYER' : (m[1] as EnemyInstanceId) }
}

function poisonCardHitOffsetX(): number {
  return readRootPxVar('--poison-card-hit-offset-x')
}

function poisonCardHitOffsetY(): number {
  return readRootPxVar('--poison-card-hit-offset-y')
}

export function PoisonCardHitFxProvider(
  props: Readonly<{ state: GameState; children: ReactNode }>,
) {
  const { state, children } = props
  const { stageLayerRef } = useRelicTravel()
  const playerAnchorRef = useRef<HTMLElement | null>(null)
  const enemyAnchorsRef = useRef<Map<EnemyInstanceId, HTMLElement>>(new Map())
  const nextIdRef = useRef(0)
  const [hits, setHits] = useState<ReadonlyArray<ActivePoisonCardHit>>([])
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

  const playPoisonCardHitAt = useCallback(
    (anchor: HTMLElement | null) => {
      const stageLayer = stageLayerRef.current
      if (!stageLayer || !anchor) return

      const center = centerOf(anchor.getBoundingClientRect())
      if (!center) return

      const { x, y } = viewportPointRelativeTo(
        stageLayer,
        center.x + poisonCardHitOffsetX(),
        center.y + poisonCardHitOffsetY(),
      )
      const id = ++nextIdRef.current
      setHits((current) => [...current, { id, x, y }])
      window.setTimeout(() => dismissHit(id), poisonCardHitFxTotalMs() + 80)
    },
    [stageLayerRef, dismissHit],
  )

  useEffect(() => {
    const { lastEvents, eventBatchId } = state.ui.debug
    consumeDebugEventBatch(eventBatchId, lastEvents, lastBatchIdRef, (line) => {
      const parsed = parsePoisonCardHpLossEvent(line)
      if (!parsed) return
      const anchor =
        parsed.unit === 'PLAYER'
          ? playerAnchorRef.current
          : enemyAnchorsRef.current.get(parsed.unit) ?? null
      playPoisonCardHitAt(anchor)
    })
  }, [state.ui.debug.eventBatchId, state.ui.debug.lastEvents, playPoisonCardHitAt])

  const value = useMemo<PoisonCardHitFxContextValue>(
    () => ({ registerPlayerAnchor, registerEnemyAnchor }),
    [registerPlayerAnchor, registerEnemyAnchor],
  )

  const hitSrc = enchantmentSpriteOverlaySrc('POISON', 'idle')

  return (
    <PoisonCardHitFxContext.Provider value={value}>
      {children}
      <div className="poisonCardHitFxLayer" aria-hidden>
        {hits.map((hit) => (
          <div
            key={hit.id}
            className="poisonCardHitFxHost"
            style={{ left: `${hit.x}px`, top: `${hit.y}px` }}
          >
            <img
              className="poisonCardHitFx__img"
              src={hitSrc}
              alt=""
              draggable={false}
              onAnimationEnd={(e) => {
                if (!e.animationName.includes('poisonCardHitFade')) return
                dismissHit(hit.id)
              }}
            />
          </div>
        ))}
      </div>
    </PoisonCardHitFxContext.Provider>
  )
}

export function usePoisonCardHitFxAnchors(): PoisonCardHitFxContextValue {
  const ctx = useContext(PoisonCardHitFxContext)
  if (!ctx) throw new Error('usePoisonCardHitFxAnchors requires PoisonCardHitFxProvider')
  return ctx
}
