import { useEffect, useMemo, useRef, useState } from 'react'
import { brokenShieldSprite, lockedShieldSprite, shieldSprite } from '../assets/displayImages'
import { useTickingNumber } from '../hooks/useTickingNumber'
import { readRootDurationMs } from '../relicTooltipPosition'
import { useTriggerFxArtProps } from '../TriggerFxContext'

export type ShieldIconDisplayVariant = 'shield' | 'lockedShield'

export type ShieldIconDisplayProps = Readonly<{
  value: number
  variant: ShieldIconDisplayVariant
  durationMs?: number
  className?: string
}>

const BROKEN_SHIELD_DISPLAY_TOKEN = '--duration-player-broken-shield-display'
const BROKEN_SHIELD_DISPLAY_FALLBACK_MS = 300

export function ShieldIconDisplay(props: ShieldIconDisplayProps) {
  const { value, variant, durationMs, className } = props
  const safeValue = Math.max(0, value)
  const { display, tickDirection } = useTickingNumber(safeValue, { durationMs })
  const [tickGlowKey, setTickGlowKey] = useState(0)
  const [showBroken, setShowBroken] = useState(false)
  /** True once this icon has shown a positive amount; cleared after the broken flash ends. */
  const hadPositiveRef = useRef(safeValue > 0 || display > 0)
  const breakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brokenDisplayMs = useMemo(() => {
    const ms = readRootDurationMs(BROKEN_SHIELD_DISPLAY_TOKEN)
    return ms > 0 ? ms : BROKEN_SHIELD_DISPLAY_FALLBACK_MS
  }, [])
  const isTicking = tickDirection !== null
  const lockedShieldFx = useTriggerFxArtProps({ kind: 'playerLockedShield' })
  const shieldFx = useTriggerFxArtProps({ kind: 'playerShield' })
  const triggerFx = variant === 'lockedShield' ? lockedShieldFx : shieldFx

  const clearBrokenFlash = () => {
    if (breakTimerRef.current != null) {
      clearTimeout(breakTimerRef.current)
      breakTimerRef.current = null
    }
    setShowBroken(false)
  }

  useEffect(() => {
    if (tickDirection) setTickGlowKey((k) => k + 1)
  }, [tickDirection])

  useEffect(() => {
    return () => {
      if (breakTimerRef.current != null) clearTimeout(breakTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (safeValue > 0 || display > 0) {
      hadPositiveRef.current = true
    }

    if (safeValue > 0) {
      clearBrokenFlash()
      return
    }

    const tickFinishedAtZero = display === 0 && !isTicking && hadPositiveRef.current
    if (!tickFinishedAtZero || breakTimerRef.current != null) return

    hadPositiveRef.current = false
    setShowBroken(true)
    breakTimerRef.current = setTimeout(() => {
      breakTimerRef.current = null
      setShowBroken(false)
    }, brokenDisplayMs)
  }, [safeValue, display, isTicking, brokenDisplayMs])

  const visible = safeValue > 0 || display > 0 || isTicking || showBroken
  const intactSrc = variant === 'shield' ? shieldSprite : lockedShieldSprite
  const src = showBroken ? brokenShieldSprite : intactSrc
  const mod =
    variant === 'shield' ? 'shieldIconDisplay--shield' : 'shieldIconDisplay--lockedShield'
  const ariaLabel = showBroken
    ? variant === 'shield'
      ? 'Shield broken'
      : 'Locked shield broken'
    : variant === 'shield'
      ? `Shield: ${display}`
      : `Locked shield: ${display}`
  const tickMod =
    !showBroken && tickDirection === 'up'
      ? 'shieldIconDisplay--tickUp'
      : !showBroken && tickDirection === 'down'
        ? 'shieldIconDisplay--tickDown'
        : ''
  const valueTickMod =
    !showBroken && tickDirection === 'up'
      ? 'tickingNumber--tickUp'
      : !showBroken && tickDirection === 'down'
        ? 'tickingNumber--tickDown'
        : ''

  const rootClass = ['shieldIconDisplay', mod, tickMod, showBroken ? 'shieldIconDisplay--broken' : '', className]
    .filter(Boolean)
    .join(' ')

  if (!visible) return null

  return (
    <div className={rootClass} role="status" aria-label={ariaLabel}>
      {!showBroken && tickDirection ? (
        <span
          key={tickGlowKey}
          className={`shieldIconDisplay__tickGlow shieldIconDisplay__tickGlow--${tickDirection}`}
          aria-hidden
        />
      ) : null}
      <img
        key={triggerFx.key}
        className={['shieldIconDisplay__art', triggerFx.className].filter(Boolean).join(' ')}
        src={src}
        alt=""
        draggable={false}
        aria-hidden
      />
      {!showBroken ? (
        <div className="shieldIconDisplay__value" aria-hidden>
          <span className={['tickingNumber', valueTickMod].filter(Boolean).join(' ')}>{display}</span>
        </div>
      ) : null}
    </div>
  )
}
