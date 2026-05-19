import { createPortal } from 'react-dom'
import { CARD_KEYWORDS, type CardKeywordId } from '../../ui/cardKeywords'

const TOOLTIP_STACK_GAP_PX = 4

export function keywordTooltipsViewportPosition(rect: DOMRect): Readonly<{ x: number; y: number }> {
  return { x: rect.right + 8, y: rect.top }
}

type KeywordTooltipsProps = Readonly<{
  ids: ReadonlyArray<CardKeywordId>
  x: number
  y: number
}>

export function KeywordTooltips(props: KeywordTooltipsProps) {
  const { ids, x, y } = props
  if (!ids.length) return null

  return createPortal(
    <div className="keywordTooltipStack" style={{ left: x, top: y }} role="presentation">
      {ids.map((id, index) => {
        const kw = CARD_KEYWORDS[id]
        return (
          <div
            key={id}
            className="keywordTooltip"
            style={{ marginTop: index === 0 ? 0 : TOOLTIP_STACK_GAP_PX }}
            role="tooltip"
          >
            <span className="keywordTooltip__label">{kw.label}</span>
            <span className="keywordTooltip__text">{kw.tooltip}</span>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
