import { useEffect, useRef, useState } from 'react'
import { bouncePathPoint } from '../bunnyLeapPath'

export type BunnyReleaseLeapProps = Readonly<{
  fromX: number
  fromY: number
  toX: number
  toY: number
  arcCount: number
  apexPx: number
  durationMs: number
  sizePx: number
  sprite: string
  seed: number
  leapId: number
  className?: string
  /** Flame aura behind the sprite (spark fire release leaps). */
  fireGlow?: boolean
  onLeapLand: (leapId: number, seed: number, x: number, y: number) => void
}>

export function BunnyReleaseLeap(props: BunnyReleaseLeapProps) {
  const {
    fromX,
    fromY,
    toX,
    toY,
    arcCount,
    apexPx,
    durationMs,
    sizePx,
    sprite,
    seed,
    leapId,
    className = 'bunnyReleaseLeap',
    fireGlow = false,
    onLeapLand,
  } = props
  const [pos, setPos] = useState<Readonly<{ x: number; y: number }>>({ x: fromX, y: fromY })
  const [landed, setLanded] = useState(false)
  const doneRef = useRef(false)
  const onLeapLandRef = useRef(onLeapLand)
  onLeapLandRef.current = onLeapLand

  useEffect(() => {
    doneRef.current = false
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      setPos(bouncePathPoint(t, fromX, fromY, toX, toY, arcCount, apexPx))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else if (!doneRef.current) {
        doneRef.current = true
        setLanded(true)
        onLeapLandRef.current(leapId, seed, toX, toY)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fromX, fromY, toX, toY, arcCount, apexPx, durationMs, seed, leapId])

  if (landed) return null

  const imgStyle = fireGlow
    ? { width: `${sizePx}px` }
    : { left: `${pos.x}px`, top: `${pos.y}px`, width: `${sizePx}px` }

  const img = (
    <img
      className={className}
      src={sprite}
      alt=""
      draggable={false}
      aria-hidden
      style={imgStyle}
    />
  )

  if (!fireGlow) return img

  const glowPhaseMs = (seed % 89) + 32
  return (
    <div
      className="sparkReleaseLeapHost"
      aria-hidden
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${sizePx}px`,
        ['--spark-leap-glow-duration' as string]: `${Math.max(1, durationMs)}ms`,
        ['--spark-leap-glow-phase' as string]: `${glowPhaseMs}ms`,
      }}
    >
      <span className="sparkReleaseLeapGlow" aria-hidden />
      {img}
    </div>
  )
}
