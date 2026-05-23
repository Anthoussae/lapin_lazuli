import type { CSSProperties } from 'react'
import { TickingNumber } from './TickingNumber'

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
    className,
  } = props

  const safeMax = Math.max(0, max)
  const displayCurrent = Math.max(0, current)
  const fillPct = safeMax > 0 ? Math.min(100, (displayCurrent / safeMax) * 100) : 0
  const amountAria = showMax ? `${displayCurrent}/${safeMax}` : String(displayCurrent)

  const style = {
    '--bar-display-outline': outlineColor,
    '--bar-display-fill': barColor,
    '--bar-display-empty': barAbsenceColor,
    '--bar-display-fill-pct': `${fillPct}%`,
  } as CSSProperties

  const rootClass = ['barDisplay', giltRim ? 'gilt-rim' : '', className].filter(Boolean).join(' ')

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
          <TickingNumber value={displayCurrent} durationMs={durationMs} />
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
