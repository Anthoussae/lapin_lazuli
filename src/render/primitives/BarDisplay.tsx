import type { CSSProperties } from 'react'
import { useTickingNumber } from '../hooks/useTickingNumber'

export type BarDisplayProps = Readonly<{
  /** Prefix shown before the amount, e.g. "Health:" */
  label: string
  current: number
  max: number
  /** When false, only `current` is shown (e.g. shield amount without a max). Default true. */
  showMax?: boolean
  outlineColor?: string
  barColor?: string
  barAbsenceColor?: string
  /** Metallic gold frame via global `.gilt-rim` tokens. */
  giltRim?: boolean
  durationMs?: number
  /** Toxic green fill for poison HP loss tick (see tokens.css --bar-display-poison-fill). */
  poisonHpDrop?: boolean
  /** Orange fill for fire damage HP loss tick (see tokens.css --bar-display-fire-fill). */
  fireHpDrop?: boolean
  className?: string
}>

const DEFAULT_OUTLINE = '#000000'
const DEFAULT_BAR = '#cc0000'
const DEFAULT_EMPTY = '#000000'

export function BarDisplay(props: BarDisplayProps) {
  const {
    label,
    current,
    max,
    showMax = true,
    outlineColor = DEFAULT_OUTLINE,
    barColor = DEFAULT_BAR,
    barAbsenceColor = DEFAULT_EMPTY,
    giltRim = false,
    durationMs,
    poisonHpDrop = false,
    fireHpDrop = false,
    className,
  } = props

  const safeMax = Math.max(0, max)
  const animateHp = durationMs != null && durationMs > 0
  const { display: tickedCurrent } = useTickingNumber(Math.max(0, current), {
    durationMs: animateHp ? durationMs : 1,
  })
  const targetCurrent = Math.max(0, current)
  const displayCurrent = animateHp ? tickedCurrent : targetCurrent
  /** Fill tracks the target HP with a CSS width transition; the number still ticks in whole steps. */
  const fillPct = safeMax > 0 ? Math.min(100, (targetCurrent / safeMax) * 100) : 0
  const amountAria = showMax ? `${displayCurrent}/${safeMax}` : String(displayCurrent)

  const style = {
    '--bar-display-outline': outlineColor,
    '--bar-display-fill': barColor,
    '--bar-display-empty': barAbsenceColor,
    '--bar-display-fill-pct': `${fillPct}%`,
    ...(animateHp && durationMs != null
      ? { '--bar-display-tick-duration': `${durationMs}ms` }
      : {}),
  } as CSSProperties

  const rootClass = [
    'barDisplay',
    giltRim ? 'gilt-rim' : '',
    animateHp ? 'barDisplay--hpTick' : '',
    poisonHpDrop ? 'barDisplay--poisonHpDrop' : '',
    fireHpDrop ? 'barDisplay--fireHpDrop' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={rootClass}
      style={style}
      role="meter"
      aria-valuenow={displayCurrent}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={`${label} ${amountAria}`}
    >
      <div className="barDisplay__track" aria-hidden>
        <div className="barDisplay__fill" />
      </div>
      <div className="barDisplay__text">
        <span className="barDisplay__label">{label}</span>
        <span className="barDisplay__amount">
          <span className="tickingNumber">{displayCurrent}</span>
          {showMax ? (
            <>
              /<span className="barDisplay__max">{safeMax}</span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  )
}
