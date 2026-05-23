import { useCallback, useRef } from 'react'
import { bunnyReleaseTinyPoofSprite } from '../assets/displayImages'

export type BunnyLeapLandPuffProps = Readonly<{
  puffId: number
  x: number
  y: number
  driftX: number
  driftY: number
  durationMs: number
  onPuffComplete: (puffId: number) => void
}>

export function BunnyLeapLandPuff(props: BunnyLeapLandPuffProps) {
  const { puffId, x, y, driftX, driftY, durationMs, onPuffComplete } = props
  const doneRef = useRef(false)
  const onPuffCompleteRef = useRef(onPuffComplete)
  onPuffCompleteRef.current = onPuffComplete

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onPuffCompleteRef.current(puffId)
  }, [puffId])

  return (
    <img
      className="bunnyLeapLandPuff"
      src={bunnyReleaseTinyPoofSprite}
      alt=""
      draggable={false}
      aria-hidden
      style={{
        left: `${x}px`,
        top: `${y}px`,
        ['--bunny-leap-land-puff-dx' as string]: `${driftX}px`,
        ['--bunny-leap-land-puff-dy' as string]: `${driftY}px`,
        ['--bunny-leap-land-puff-duration' as string]: `${Math.max(1, durationMs)}ms`,
      }}
      onAnimationEnd={(e) => {
        if (e.currentTarget !== e.target) return
        if (e.animationName !== 'bunnyLeapLandPuffDrift') return
        finish()
      }}
    />
  )
}
