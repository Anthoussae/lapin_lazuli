import type { EnemyBoonId } from '../../data/enemyBoons'
import { EnemyBoons } from '../../data/enemyBoons'
import { enemyBoonTooltipViewportOffsetX } from '../gameTooltipConfig'
import { GameTooltipStack } from './GameTooltip'

export function enemyBoonTooltipsViewportPosition(rect: DOMRect): Readonly<{ x: number; y: number }> {
  return { x: rect.right + enemyBoonTooltipViewportOffsetX(), y: rect.top }
}

type EnemyBoonTooltipsProps = Readonly<{
  boonIds: ReadonlyArray<EnemyBoonId>
  x: number
  y: number
}>

export function EnemyBoonTooltips(props: EnemyBoonTooltipsProps) {
  const { boonIds, x, y } = props
  const entries = boonIds.map((id) => {
    const boon = EnemyBoons[id]
    return { key: id, label: boon.name, text: boon.tooltipText }
  })

  return <GameTooltipStack entries={entries} x={x} y={y} />
}
