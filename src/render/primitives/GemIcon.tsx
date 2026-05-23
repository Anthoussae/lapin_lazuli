import { useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { gemTooltipViewportPosition } from '../relicTooltipPosition'
import { RelicTooltip } from './RelicTooltip'

export type GemIconProps = Readonly<{
  imageSrc?: string
  fallback: ReactNode
  alt?: string
  tooltipName?: string
  tooltipEffect?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
  /** Sprite rotation in degrees (applied around center). */
  rotationDeg?: number
}>

export function GemIcon(props: GemIconProps) {
  const {
    imageSrc,
    fallback,
    alt = '',
    tooltipName,
    tooltipEffect = '',
    onClick,
    disabled,
    className,
    rotationDeg,
  } = props
  const [imgFailed, setImgFailed] = useState(false)
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)
  const showImage = imageSrc != null && imageSrc !== '' && !imgFailed
  const showTooltip = tooltipName != null && tooltipName !== ''

  const classes = [
    'gemIcon',
    onClick != null ? 'gemIcon--clickable' : null,
    disabled ? 'gemIcon--disabled' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const showTooltipAtAnchor = (e: MouseEvent<HTMLElement>) => {
    if (!showTooltip) return
    setTip(gemTooltipViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearTooltip = () => setTip(null)

  const visualStyle =
    rotationDeg != null ? ({ ['--gem-icon-rotation' as string]: `${rotationDeg}deg` } as const) : undefined

  const visual = showImage ? (
    <img className="gemIcon__img" src={imageSrc} alt={alt} draggable={false} onError={() => setImgFailed(true)} />
  ) : (
    <span className="gemIcon__fallback" aria-hidden={alt !== ''}>
      {fallback}
    </span>
  )

  const tooltip =
    tip && showTooltip
      ? createPortal(
          <RelicTooltip name={tooltipName} effect={tooltipEffect} x={tip.x} y={tip.y} />,
          document.body,
        )
      : null

  if (onClick != null) {
    return (
      <>
        <button
          type="button"
          className={classes}
          disabled={disabled}
          onClick={onClick}
          onMouseEnter={showTooltipAtAnchor}
          onMouseLeave={clearTooltip}
          aria-label={alt || tooltipName}
        >
          <span className="gemIcon__visual" style={visualStyle}>
            {visual}
          </span>
        </button>
        {tooltip}
      </>
    )
  }

  return (
    <>
      <div
        className={classes}
        onMouseEnter={showTooltipAtAnchor}
        onMouseLeave={clearTooltip}
      >
        <span className="gemIcon__visual" style={visualStyle}>
          {visual}
        </span>
      </div>
      {tooltip}
    </>
  )
}
