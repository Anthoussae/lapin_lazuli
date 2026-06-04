import { CARD_KEYWORDS, FOIL_CARD_TOOLTIP, type CardKeywordId } from '../../ui/cardKeywords'
import { gameTooltipAnchorOffsetX } from '../gameTooltipConfig'
import { gameCardHoverTooltipAnchorRect } from '../hoverTooltipAnchorRect'
import { GameTooltipStack } from './GameTooltip'

export function keywordTooltipsViewportPosition(element: HTMLElement): Readonly<{ x: number; y: number }> {
  const anchor = gameCardHoverTooltipAnchorRect(element)
  return { x: anchor.right + gameTooltipAnchorOffsetX(), y: anchor.top }
}

type KeywordTooltipsProps = Readonly<{
  ids: ReadonlyArray<CardKeywordId>
  x: number
  y: number
  foil?: boolean
}>

export function KeywordTooltips(props: KeywordTooltipsProps) {
  const { ids, x, y, foil = false } = props
  const entries = [
    ...(foil
      ? [{ key: 'foil' as const, label: FOIL_CARD_TOOLTIP.label, text: FOIL_CARD_TOOLTIP.tooltip }]
      : []),
    ...ids.map((id) => {
      const kw = CARD_KEYWORDS[id]
      return { key: id, label: kw.label, text: kw.tooltip }
    }),
  ]

  return <GameTooltipStack entries={entries} x={x} y={y} />
}
