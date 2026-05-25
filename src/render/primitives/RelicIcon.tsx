import { useState, type MouseEvent, type ReactNode, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { relicTooltipViewportPosition } from '../relicTooltipPosition'
import { RelicTooltip } from './RelicTooltip'

export type RelicIconSize = 'default' | 'thumb'

export type RelicIconProps = Readonly<{
  imageSrc?: string
  fallback: ReactNode
  alt?: string
  tooltipName?: string
  tooltipEffect?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  selected?: boolean
  traveling?: boolean
  /** Default relic art size everywhere; use `thumb` only when a smaller icon is intentional. */
  size?: RelicIconSize
  className?: string
  artClassName?: string
  artKey?: number
  buttonRef?: Ref<HTMLButtonElement>
}>

export function RelicIcon(props: RelicIconProps) {
  const {
    imageSrc,
    fallback,
    alt = '',
    tooltipName,
    tooltipEffect = '',
    onClick,
    disabled,
    selected,
    traveling,
    size = 'default',
    className,
    artClassName,
    artKey,
    buttonRef,
  } = props
  const [imgFailed, setImgFailed] = useState(false)
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)
  const showImage = imageSrc != null && imageSrc !== '' && !imgFailed
  const showTooltip = tooltipName != null && tooltipName !== ''

  const classes = [
    'relicIcon',
    onClick != null ? 'relicIcon--clickable' : null,
    disabled ? 'relicIcon--disabled' : null,
    selected ? 'relicIcon--selected' : null,
    traveling ? 'relicIcon--traveling' : null,
    size === 'thumb' ? 'relicIcon--sizeThumb' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const placeTooltip = (e: MouseEvent<HTMLElement>) => {
    if (!showTooltip) return
    setTip(relicTooltipViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearTooltip = () => setTip(null)

  const imgClass = ['relicIcon__img', artClassName].filter(Boolean).join(' ')

  const visual = showImage ? (
    <img
      key={artKey}
      className={imgClass}
      src={imageSrc}
      alt={alt}
      draggable={false}
      onError={() => setImgFailed(true)}
    />
  ) : (
    <span className="relicIcon__fallback" aria-hidden={alt !== ''}>
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
          ref={buttonRef}
          type="button"
          className={classes}
          disabled={disabled || traveling}
          onClick={onClick}
          onMouseEnter={placeTooltip}
          onMouseMove={placeTooltip}
          onMouseLeave={clearTooltip}
          aria-label={alt || tooltipName}
        >
          {visual}
        </button>
        {tooltip}
      </>
    )
  }

  return (
    <>
      <div
        className={classes}
        onMouseEnter={placeTooltip}
        onMouseMove={placeTooltip}
        onMouseLeave={clearTooltip}
      >
        {visual}
      </div>
      {tooltip}
    </>
  )
}
