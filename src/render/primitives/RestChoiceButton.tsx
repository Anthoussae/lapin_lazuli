import { useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { relicTooltipViewportPosition } from '../relicTooltipPosition'
import { GameTooltipStack } from './GameTooltip'

type RestChoiceButtonProps = Readonly<{
  label: string
  tooltipText: string
  className: string
  disabled?: boolean
  onClick?: () => void
}>

export function RestChoiceButton(props: RestChoiceButtonProps) {
  const { label, tooltipText, className, disabled, onClick } = props
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)

  const placeTooltip = (e: MouseEvent<HTMLButtonElement>) => {
    setTip(relicTooltipViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearTooltip = () => setTip(null)

  const tooltip =
    tip != null
      ? createPortal(
          <GameTooltipStack
            entries={[{ key: label, label, text: tooltipText }]}
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
}
