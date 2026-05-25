import { CARD_KEYWORDS, type CardKeywordId } from '../../ui/cardKeywords'
import { gameTooltipAnchorOffsetX } from '../gameTooltipConfig'
import { GameTooltipStack } from './GameTooltip'

export function keywordTooltipsViewportPosition(rect: DOMRect): Readonly<{ x: number; y: number }> {
  return { x: rect.right + gameTooltipAnchorOffsetX(), y: rect.top }
}

type KeywordTooltipsProps = Readonly<{
  ids: ReadonlyArray<CardKeywordId>
  x: number
  y: number
}>

export function KeywordTooltips(props: KeywordTooltipsProps) {
  const { ids, x, y } = props
  const entries = ids.map((id) => {
    const kw = CARD_KEYWORDS[id]
    return { key: id, label: kw.label, text: kw.tooltip }
  })

  return <GameTooltipStack entries={entries} x={x} y={y} />
}
