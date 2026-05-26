import { forwardRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { relicTooltipViewportPosition } from '../relicTooltipPosition'
import { GameTooltipStack } from './GameTooltip'

type RestChoiceButtonProps = Readonly<{
  label: string
  tooltipText: string
  /** When true, tooltip shows only {@link tooltipText} (no separate title line). */
  tooltipSingleLine?: boolean
  className: string
  disabled?: boolean
  onClick?: () => void
}>

export const RestChoiceButton = forwardRef<HTMLButtonElement, RestChoiceButtonProps>(function RestChoiceButton(
  props,
  ref,
) {
  const { label, tooltipText, tooltipSingleLine, className, disabled, onClick } = props
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)

  const placeTooltip = (e: MouseEvent<HTMLButtonElement>) => {
    setTip(relicTooltipViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearTooltip = () => setTip(null)

  const tooltip =
    tip != null
      ? createPortal(
          <GameTooltipStack
            entries={[
              tooltipSingleLine
                ? { key: label, label: tooltipText }
                : { key: label, label, text: tooltipText },
            ]}
            x={tip.x}
            y={tip.y}
            anchor="topCenter"
          />,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={className}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={placeTooltip}
        onMouseMove={placeTooltip}
        onMouseLeave={clearTooltip}
        aria-label={`${label}: ${tooltipText}`}
      >
        {label}
      </button>
      {tooltip}
    </>
  )
})
