import { useEffect, useRef, useState } from 'react'

export const DEFAULT_TICKING_NUMBER_DURATION_MS = 400

export type UseTickingNumberOptions = Readonly<{
  durationMs?: number
}>

export type TickDirection = 'up' | 'down'

export type TickingNumberState = Readonly<{
  display: number
  /** Set while the counter is stepping; cleared when the tick finishes. */
  tickDirection: TickDirection | null
}>

/**
 * Returns an integer that steps from the previous value toward `value` over a short duration.
 * Reused for gold, keys, health, and any other HUD counter that should "tick" on change.
 */
export function useTickingNumber(
  value: number,
  options: UseTickingNumberOptions = {},
): TickingNumberState {
  const { durationMs = DEFAULT_TICKING_NUMBER_DURATION_MS } = options
  const [display, setDisplay] = useState(value)
  const [tickDirection, setTickDirection] = useState<TickDirection | null>(null)
  const displayRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = displayRef.current
    const to = value
    if (from === to) {
      setDisplay(to)
      return
    }

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)

    setTickDirection(to > from ? 'up' : 'down')

    const start = performance.now()
    const diff = to - from

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const next = Math.round(from + diff * t)
      displayRef.current = next
      setDisplay(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        displayRef.current = to
        setDisplay(to)
        setTickDirection(null)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs])

  return { display, tickDirection }
}
