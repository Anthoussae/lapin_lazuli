import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { CardDescSegment } from '../../ui/describe'
import { gameTooltipEdgePaddingPx, gameTooltipStackGapPx } from '../gameTooltipConfig'
import { clampElementToGameWindow } from '../gameWindowBounds'
import { CardDescSegments } from './CardDesc'

export type GameTooltipEntry = Readonly<{
  key: string
  label: string
  text?: string
  textSegments?: ReadonlyArray<CardDescSegment>
}>

export type GameTooltipAnchor = 'topLeft' | 'topCenter'

type GameTooltipStackProps = Readonly<{
  entries: ReadonlyArray<GameTooltipEntry>
  x: number
  y: number
  anchor?: GameTooltipAnchor
  className?: string
}>

export function GameTooltipStack(props: GameTooltipStackProps) {
  const { entries, x, y, anchor = 'topLeft', className } = props
  const stackRef = useRef<HTMLDivElement>(null)
  const stackGap = gameTooltipStackGapPx()

  useLayoutEffect(() => {
    const el = stackRef.current
    if (!el) return

    el.style.left = `${x}px`
    el.style.top = `${y}px`
    clampElementToGameWindow(el, gameTooltipEdgePaddingPx())
  }, [x, y, entries, anchor])

  if (!entries.length) return null

  const stackStyle: CSSProperties = {
    left: x,
    top: y,
    ...(anchor === 'topCenter' ? { transform: 'translateX(-50%)' } : null),
  }

  return createPortal(
    <div
      ref={stackRef}
      className={['gameTooltipStack', className].filter(Boolean).join(' ')}
      style={stackStyle}
      role="presentation"
    >
      {entries.map((entry, index) => (
        <div
          key={entry.key}
          className="gameTooltip"
          style={{ marginTop: index === 0 ? 0 : stackGap }}
          role="tooltip"
        >
          <span className="gameTooltip__label">{entry.label}</span>
          {entry.textSegments ? (
            <span className="gameTooltip__text">
              <CardDescSegments segments={entry.textSegments} />
            </span>
          ) : entry.text ? (
            <span className="gameTooltip__text">{entry.text}</span>
          ) : null}
        </div>
      ))}
    </div>,
    document.body,
  )
}
