import { useEffect, useRef, useState } from 'react'
import { DEFAULT_TICKING_NUMBER_DURATION_MS } from './useTickingNumber'

export type UseHpAfterShieldTicksOptions = Readonly<{
  enabled: boolean
  durationMs?: number
}>

/**
 * When shields and HP both drop on the same update (overflow damage), keeps the
 * displayed HP at its prior value until shield tick animations finish.
 */
export function useHpAfterShieldTicks(
  hp: number,
  shield: number,
  lockedShield: number,
  options: UseHpAfterShieldTicksOptions,
): number {
  const { enabled, durationMs = DEFAULT_TICKING_NUMBER_DURATION_MS } = options
  const [displayHp, setDisplayHp] = useState(hp)
  const prevRef = useRef({ hp, shield, lockedShield })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const prev = prevRef.current
    prevRef.current = { hp, shield, lockedShield }

    if (!enabled) {
      setDisplayHp(hp)
      return
    }

    const shieldDropped = shield < prev.shield || lockedShield < prev.lockedShield
    const hpDropped = hp < prev.hp
    const overflow = shieldDropped && hpDropped

    if (!overflow) {
      setDisplayHp(hp)
      return
    }

    setDisplayHp(prev.hp)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      setDisplayHp(hp)
    }, durationMs)

    return () => {
      if (timeoutRef.current != null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [hp, shield, lockedShield, enabled, durationMs])

  return displayHp
}
