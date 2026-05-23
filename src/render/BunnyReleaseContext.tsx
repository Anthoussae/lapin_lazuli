import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import type { EnemyInstanceId } from '../core/types/ids'
import { bunnyLeapSpriteForSeed } from './assets/displayImages'
import { centerOf } from './cardLayout'
import { bunnyReleaseFxHoldMs, readBunnyLeapConfig, readBunnyLeapLandPuffConfig } from './bunnyLeapConfig'
import { hash01, pickApexPx, pickArcCount, pickLandPuffDrift, pickRangedMs } from './bunnyLeapPath'
import { bunnyReleaseTotalMs, readBunnyReleaseAnchorYOffset } from './bunnyReleaseConfig'
import { BunnyLeapLandPuff } from './primitives/BunnyLeapLandPuff'
import { BunnyReleaseLeap } from './primitives/BunnyReleaseLeap'
import { BunnyReleasePuffs } from './primitives/BunnyReleasePuffs'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveBunnyRelease = Readonly<{
  id: number
  x: number
  y: number
  seed: number
  spriteCount: number
}>

type ActiveBunnyLeap = Readonly<{
  id: number
  seed: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  arcCount: number
  apexPx: number
  durationMs: number
  sizePx: number
  sprite: string
}>

type ActiveLandPuff = Readonly<{
  id: number
  x: number
  y: number
  driftX: number
  driftY: number
  durationMs: number
}>

type BunnyReleaseContextValue = Readonly<{
  cauldronRef: MutableRefObject<HTMLDivElement | null>
  registerLeapTarget: (enemyId: EnemyInstanceId, el: HTMLElement | null) => void
}>

const BunnyReleaseContext = createContext<BunnyReleaseContextValue | null>(null)

type BunnyReleaseProviderProps = Readonly<{
  children: ReactNode
  bunnyReleasePending: boolean
  bunnyReleaseSpriteCount: number
  bunnyReleaseBunnyCount: number
  onComplete: () => void
}>

export function BunnyReleaseProvider(props: BunnyReleaseProviderProps) {
  const {
    children,
    bunnyReleasePending,
    bunnyReleaseSpriteCount,
    bunnyReleaseBunnyCount,
    onComplete,
  } = props
  const { stageLayerRef } = useRelicTravel()
  const cauldronRef = useRef<HTMLDivElement | null>(null)
  const leapTargetRef = useRef<HTMLElement | null>(null)
  const nextIdRef = useRef(0)
  const [releases, setReleases] = useState<ReadonlyArray<ActiveBunnyRelease>>([])
  const [leaps, setLeaps] = useState<ReadonlyArray<ActiveBunnyLeap>>([])
  const [landPuffs, setLandPuffs] = useState<ReadonlyArray<ActiveLandPuff>>([])
  const animatingRef = useRef(false)
  const leapTimeoutsRef = useRef<ReadonlyArray<number>>([])

  const registerLeapTarget = useCallback((_enemyId: EnemyInstanceId, el: HTMLElement | null) => {
    leapTargetRef.current = el
  }, [])

  const clearLeapTimeouts = useCallback(() => {
    for (const id of leapTimeoutsRef.current) window.clearTimeout(id)
    leapTimeoutsRef.current = []
  }, [])

  const removeLeap = useCallback((id: number) => {
    setLeaps((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const removeLandPuff = useCallback((id: number) => {
    setLandPuffs((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const spawnLandPuff = useCallback((seed: number, x: number, y: number) => {
    const cfg = readBunnyLeapLandPuffConfig()
    const { dx, dy } = pickLandPuffDrift(seed, cfg.distanceMinPx, cfg.distanceMaxPx)
    const id = ++nextIdRef.current
    setLandPuffs((prev) => [
      ...prev,
      {
        id,
        x,
        y,
        driftX: dx,
        driftY: dy,
        durationMs: pickRangedMs(seed, cfg.durationMinMs, cfg.durationMaxMs, 43),
      },
    ])
  }, [])

  const handleLeapLand = useCallback(
    (leapId: number, seed: number, x: number, y: number) => {
      spawnLandPuff(seed, x, y)
      removeLeap(leapId)
    },
    [spawnLandPuff, removeLeap],
  )

  const handleLandPuffComplete = useCallback(
    (puffId: number) => {
      removeLandPuff(puffId)
    },
    [removeLandPuff],
  )

  const spawnLeap = useCallback(
    (tickIndex: number, bunnyCount: number) => {
      const stageLayer = stageLayerRef.current
      const cauldron = cauldronRef.current
      const targetEl = leapTargetRef.current
      if (!stageLayer || !cauldron || !targetEl || bunnyCount <= 0) return

      const cauldronCenter = centerOf(cauldron.getBoundingClientRect())
      const targetCenter = centerOf(targetEl.getBoundingClientRect())
      if (!cauldronCenter || !targetCenter) return

      const leapCfg = readBunnyLeapConfig()
      const puffAnchorY = readBunnyReleaseAnchorYOffset()
      const seed = ((Math.random() * 0x7fffffff) | 0) ^ (tickIndex * 0x85ebca6b)
      const scatterX = (hash01(seed, 1) * 2 - 1) * leapCfg.scatterX
      const scatterY = (hash01(seed, 2) * 2 - 1) * leapCfg.scatterY
      const from = viewportPointRelativeTo(
        stageLayer,
        cauldronCenter.x + leapCfg.spawnCenterX + scatterX,
        cauldronCenter.y + puffAnchorY + leapCfg.spawnCenterY + scatterY,
      )
      const to = viewportPointRelativeTo(stageLayer, targetCenter.x, targetCenter.y)
      const id = ++nextIdRef.current

      setLeaps((prev) => [
        ...prev,
        {
          id,
          seed,
          fromX: from.x,
          fromY: from.y,
          toX: to.x,
          toY: to.y,
          arcCount: pickArcCount(seed, leapCfg.arcMin, leapCfg.arcMax),
          apexPx: pickApexPx(seed, leapCfg.apexMinPx, leapCfg.apexMaxPx),
          durationMs: leapCfg.travelDurationMs,
          sizePx: leapCfg.sizePx,
          sprite: bunnyLeapSpriteForSeed(seed),
        },
      ])
    },
    [stageLayerRef],
  )

  const scheduleLeaps = useCallback(
    (bunnyCount: number) => {
      clearLeapTimeouts()
      if (bunnyCount <= 0) return
      const tickMs = bunnyReleaseTotalMs() / bunnyCount
      const ids: number[] = []
      for (let i = 0; i < bunnyCount; i++) {
        ids.push(
          window.setTimeout(() => {
            spawnLeap(i, bunnyCount)
          }, i * tickMs),
        )
      }
      leapTimeoutsRef.current = ids
    },
    [clearLeapTimeouts, spawnLeap],
  )

  const spawnRelease = useCallback(() => {
    if (bunnyReleaseSpriteCount <= 0) return false
    const stageLayer = stageLayerRef.current
    const cauldron = cauldronRef.current
    if (!stageLayer || !cauldron) return false

    const center = centerOf(cauldron.getBoundingClientRect())
    if (!center) return false

    const anchorY = readBunnyReleaseAnchorYOffset()
    const { x, y } = viewportPointRelativeTo(stageLayer, center.x, center.y + anchorY)
    const id = ++nextIdRef.current
    const seed = (Math.random() * 0x7fffffff) | 0
    setReleases((prev) => [...prev, { id, x, y, seed, spriteCount: bunnyReleaseSpriteCount }])
    window.setTimeout(() => {
      setReleases((prev) => prev.filter((r) => r.id !== id))
    }, bunnyReleaseTotalMs())
    return true
  }, [bunnyReleaseSpriteCount, stageLayerRef])

  useEffect(() => {
    if (!bunnyReleasePending || animatingRef.current) return

    let timeoutId: number | undefined

    const start = (): boolean => {
      if (!spawnRelease()) return false
      animatingRef.current = true
      const bunnyCount = Math.max(0, bunnyReleaseBunnyCount)
      scheduleLeaps(bunnyCount)
      const holdMs = bunnyReleaseFxHoldMs(bunnyCount)
      timeoutId = window.setTimeout(() => {
        animatingRef.current = false
        clearLeapTimeouts()
        onComplete()
      }, holdMs)
      return true
    }

    if (start()) {
      return () => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId)
        clearLeapTimeouts()
      }
    }

    const raf = window.requestAnimationFrame(() => {
      if (!start()) onComplete()
    })
    return () => {
      window.cancelAnimationFrame(raf)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      clearLeapTimeouts()
    }
  }, [
    bunnyReleasePending,
    bunnyReleaseBunnyCount,
    onComplete,
    spawnRelease,
    scheduleLeaps,
    clearLeapTimeouts,
  ])

  useEffect(() => {
    if (!bunnyReleasePending) {
      animatingRef.current = false
      clearLeapTimeouts()
    }
  }, [bunnyReleasePending, clearLeapTimeouts])

  return (
    <BunnyReleaseContext.Provider value={{ cauldronRef, registerLeapTarget }}>
      {children}
      <div className="bunnyReleaseFxLayer" aria-hidden>
        {releases.map((r) => (
          <div
            key={r.id}
            className="bunnyReleaseHost"
            style={{ left: `${r.x}px`, top: `${r.y}px` }}
          >
            <BunnyReleasePuffs seed={r.seed} spriteCount={r.spriteCount} />
          </div>
        ))}
        {leaps.map((l) => (
          <BunnyReleaseLeap
            key={l.id}
            fromX={l.fromX}
            fromY={l.fromY}
            toX={l.toX}
            toY={l.toY}
            arcCount={l.arcCount}
            apexPx={l.apexPx}
            durationMs={l.durationMs}
            sizePx={l.sizePx}
            sprite={l.sprite}
            seed={l.seed}
            leapId={l.id}
            onLeapLand={handleLeapLand}
          />
        ))}
        {landPuffs.map((p) => (
          <BunnyLeapLandPuff
            key={p.id}
            puffId={p.id}
            x={p.x}
            y={p.y}
            driftX={p.driftX}
            driftY={p.driftY}
            durationMs={p.durationMs}
            onPuffComplete={handleLandPuffComplete}
          />
        ))}
      </div>
    </BunnyReleaseContext.Provider>
  )
}

export function useBunnyRelease(): BunnyReleaseContextValue {
  const ctx = useContext(BunnyReleaseContext)
  if (!ctx) throw new Error('useBunnyRelease must be used within BunnyReleaseProvider')
  return ctx
}
