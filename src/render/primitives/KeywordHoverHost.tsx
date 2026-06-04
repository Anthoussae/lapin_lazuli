import { useState, type MouseEvent, type ReactNode } from 'react'
import type { CardKeywordId } from '../../ui/cardKeywords'
import { KeywordTooltips, keywordTooltipsViewportPosition } from './KeywordTooltips'

type KeywordHoverHostProps = Readonly<{
  keywordIds: ReadonlyArray<CardKeywordId>
  children: ReactNode
  className?: string
}>

export function KeywordHoverHost(props: KeywordHoverHostProps) {
  const { keywordIds, children, className } = props
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)

  const placeTooltip = (e: MouseEvent<HTMLElement>) => {
    if (!keywordIds.length) return
    setTip(keywordTooltipsViewportPosition(e.currentTarget))
  }

  const clearTooltip = () => setTip(null)

  return (
    <>
      <div
        className={className}
        onMouseEnter={placeTooltip}
        onMouseLeave={clearTooltip}
      >
        {children}
      </div>
      {tip ? <KeywordTooltips ids={keywordIds} x={tip.x} y={tip.y} /> : null}
    </>
  )
}
