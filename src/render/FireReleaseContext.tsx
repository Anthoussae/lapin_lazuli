import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import type { EnemyInstanceId } from '../core/types/ids'
import { fireReleaseSpriteCount } from '../systems/cards/fireRelease'
import { sparkLeapSpriteForSeed } from './assets/displayImages'
import { centerOf } from './cardLayout'
import {
  fireReleaseTotalMs,
  readFireReleaseAnchorXOffset,
  readFireReleaseAnchorYOffset,
} from './fireReleaseConfig'
import { hash01, pickApexPx, pickArcCount, pickLandPuffDrift, pickRangedMs } from './bunnyLeapPath'
import { FireReleaseSparks } from './primitives/FireReleaseSparks'
import { BunnyReleaseLeap } from './primitives/BunnyReleaseLeap'
import { SparkLeapLandPuff } from './primitives/SparkLeapLandPuff'
import {
  fireReleaseFxHoldMs,
  readSparkLeapConfig,
  readSparkLeapLandPuffConfig,
} from './sparkLeapConfig'
import { useRelicTravel } from './RelicTravelContext'
import { viewportPointRelativeTo } from './relicBeltLayout'

type ActiveFireRelease = Readonly<{
  id: number
  x: number
  y: number
  seed: number
  spriteCount: number
}>

type ActiveSparkLeap = Readonly<{
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
  seed: number
}>

type FireReleaseContextValue = Readonly<{
  playerPlaceholderRef: MutableRefObject<HTMLDivElement | null>
  registerLeapTarget: (enemyId: EnemyInstanceId, el: HTMLElement | null) => void
  playFireRelease: (damage: number) => void
}>

const FireReleaseContext = createContext<FireReleaseContextValue | null>(null)

type FireReleaseProviderProps = Readonly<{
  children: ReactNode
}>

export function FireReleaseProvider(props: FireReleaseProviderProps) {
  const { children } = props
  const { stageLayerRef } = useRelicTravel()
  const playerPlaceholderRef = useRef<HTMLDivElement | null>(null)
  const leapTargetRef = useRef<HTMLElement | null>(null)
  const nextIdRef = useRef(0)
  const [releases, setReleases] = useState<ReadonlyArray<ActiveFireRelease>>([])
  const [leaps, setLeaps] = useState<ReadonlyArray<ActiveSparkLeap>>([])
  const [landPuffs, setLandPuffs] = useState<ReadonlyArray<ActiveLandPuff>>([])
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
    const cfg = readSparkLeapLandPuffConfig()
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
        seed,
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

  const captureLeapTarget = useCallback((): Readonly<{ x: number; y: number }> | null => {
    const stageLayer = stageLayerRef.current
    const targetEl = leapTargetRef.current
    if (!stageLayer || !targetEl) return null
    const targetCenter = centerOf(targetEl.getBoundingClientRect())
    if (!targetCenter) return null
    return viewportPointRelativeTo(stageLayer, targetCenter.x, targetCenter.y)
  }, [stageLayerRef])

  const spawnLeap = useCallback(
    (
      tickIndex: number,
      sparkCount: number,
      target: Readonly<{ x: number; y: number }>,
    ) => {
      const stageLayer = stageLayerRef.current
      const placeholder = playerPlaceholderRef.current
      if (!stageLayer || !placeholder || sparkCount <= 0) return

      const placeholderCenter = centerOf(placeholder.getBoundingClientRect())
      if (!placeholderCenter) return

      const leapCfg = readSparkLeapConfig()
      const anchorX = readFireReleaseAnchorXOffset()
      const anchorY = readFireReleaseAnchorYOffset()
      const seed = ((Math.random() * 0x7fffffff) | 0) ^ (tickIndex * 0x85ebca6b)
      const scatterX = (hash01(seed, 1) * 2 - 1) * leapCfg.scatterX
      const scatterY = (hash01(seed, 2) * 2 - 1) * leapCfg.scatterY
      const from = viewportPointRelativeTo(
        stageLayer,
        placeholderCenter.x + anchorX + leapCfg.spawnCenterX + scatterX,
        placeholderCenter.y + anchorY + leapCfg.spawnCenterY + scatterY,
      )
      const to = target
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
          sprite: sparkLeapSpriteForSeed(seed),
        },
      ])
    },
    [stageLayerRef],
  )

  const scheduleLeaps = useCallback(
    (sparkCount: number, target: Readonly<{ x: number; y: number }>) => {
      clearLeapTimeouts()
      if (sparkCount <= 0) return
      const tickMs = fireReleaseTotalMs() / sparkCount
      const ids: number[] = []
      for (let i = 0; i < sparkCount; i++) {
        ids.push(
          window.setTimeout(() => {
            spawnLeap(i, sparkCount, target)
          }, i * tickMs),
        )
      }
      leapTimeoutsRef.current = ids
    },
    [clearLeapTimeouts, spawnLeap],
  )

  const playFireRelease = useCallback(
    (damage: number) => {
      const spriteCount = fireReleaseSpriteCount(damage)
      if (spriteCount <= 0) return

      const stageLayer = stageLayerRef.current
      const placeholder = playerPlaceholderRef.current
      if (!stageLayer || !placeholder) return

      const center = centerOf(placeholder.getBoundingClientRect())
      if (!center) return

      const anchorX = readFireReleaseAnchorXOffset()
      const anchorY = readFireReleaseAnchorYOffset()
      const { x, y } = viewportPointRelativeTo(stageLayer, center.x + anchorX, center.y + anchorY)
      const id = ++nextIdRef.current
      const seed = (Math.random() * 0x7fffffff) | 0
      setReleases((prev) => [...prev, { id, x, y, seed, spriteCount }])
      const leapTarget = captureLeapTarget()
      if (leapTarget) scheduleLeaps(spriteCount, leapTarget)
      const holdMs = fireReleaseFxHoldMs(spriteCount)
      window.setTimeout(() => {
        setReleases((prev) => prev.filter((r) => r.id !== id))
        clearLeapTimeouts()
      }, holdMs)
    },
    [stageLayerRef, captureLeapTarget, scheduleLeaps, clearLeapTimeouts],
  )

  return (
    <FireReleaseContext.Provider value={{ playerPlaceholderRef, registerLeapTarget, playFireRelease }}>
      {children}
      <div className="fireReleaseFxLayer" aria-hidden>
        {releases.map((r) => (
          <div
            key={r.id}
            className="fireReleaseHost"
            style={{ left: `${r.x}px`, top: `${r.y}px` }}
          >
            <FireReleaseSparks seed={r.seed} spriteCount={r.spriteCount} />
          </div>
        ))}
        {leaps.map((l) => (
          <BunnyReleaseLeap
            key={l.id}
            className="sparkReleaseLeap"
            fireGlow
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
          <SparkLeapLandPuff
            key={p.id}
            puffId={p.id}
            x={p.x}
            y={p.y}
            driftX={p.driftX}
            driftY={p.driftY}
            durationMs={p.durationMs}
            seed={p.seed}
            onPuffComplete={handleLandPuffComplete}
          />
        ))}
      </div>
    </FireReleaseContext.Provider>
  )
}

export function useFireRelease(): FireReleaseContextValue {
  const ctx = useContext(FireReleaseContext)
  if (!ctx) throw new Error('useFireRelease must be used within FireReleaseProvider')
  return ctx
}
