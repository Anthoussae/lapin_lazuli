import { useEffect, useRef, useState } from 'react'

export type UseTickingNumberOptions = Readonly<{
  durationMs?: number
}>

/**
 * Returns an integer that steps from the previous value toward `value` over a short duration.
 * Reused for gold, keys, health, and any other HUD counter that should "tick" on change.
 */
export function useTickingNumber(value: number, options: UseTickingNumberOptions = {}): number {
  const { durationMs = 400 } = options
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = displayRef.current
    const to = value
    if (from === to) return

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)

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
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs])

  return display
}
