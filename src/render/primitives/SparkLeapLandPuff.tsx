import { useCallback, useRef } from 'react'
import { sparkLeapLandSpriteForSeed } from '../assets/displayImages'

export type SparkLeapLandPuffProps = Readonly<{
  puffId: number
  x: number
  y: number
  driftX: number
  driftY: number
  durationMs: number
  seed: number
  onPuffComplete: (puffId: number) => void
}>

export function SparkLeapLandPuff(props: SparkLeapLandPuffProps) {
  const { puffId, x, y, driftX, driftY, durationMs, seed, onPuffComplete } = props
  const doneRef = useRef(false)
  const onPuffCompleteRef = useRef(onPuffComplete)
  onPuffCompleteRef.current = onPuffComplete

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onPuffCompleteRef.current(puffId)
  }, [puffId])

  const puffDuration = Math.max(1, durationMs)
  const glowPhaseMs = (seed % 73) + 24

  return (
    <div
      className="sparkLeapLandPuffHost"
      aria-hidden
      style={{
        left: `${x}px`,
        top: `${y}px`,
        ['--spark-leap-land-puff-dx' as string]: `${driftX}px`,
        ['--spark-leap-land-puff-dy' as string]: `${driftY}px`,
        ['--spark-leap-land-puff-duration' as string]: `${puffDuration}ms`,
        ['--spark-leap-glow-phase' as string]: `${glowPhaseMs}ms`,
      }}
      onAnimationEnd={(e) => {
        if (e.currentTarget !== e.target) return
        if (e.animationName !== 'sparkLeapLandPuffDrift') return
        finish()
      }}
    >
      <span className="sparkLeapLandPuffGlow" aria-hidden />
      <img
        className="sparkLeapLandPuff"
        src={sparkLeapLandSpriteForSeed(seed)}
        alt=""
        draggable={false}
        aria-hidden
      />
    </div>
  )
}
