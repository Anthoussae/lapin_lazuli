import { useState, type MouseEvent, type ReactNode } from 'react'
import type { EnemyBoonId } from '../../data/enemyBoons'
import { EnemyBoons } from '../../data/enemyBoons'
import { relicTooltipViewportPosition } from '../relicTooltipPosition'
import { GameTooltipStack } from './GameTooltip'

type TooltipEntry = Readonly<{ key: string; label: string; text?: string }>

type CombatTargetHoverHostProps = Readonly<{
  boonIds?: ReadonlyArray<EnemyBoonId>
  enchantmentEntries?: ReadonlyArray<TooltipEntry>
  children: ReactNode
  className?: string
}>

export function CombatTargetHoverHost(props: CombatTargetHoverHostProps) {
  const { boonIds = [], enchantmentEntries = [], children, className } = props
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)

  const boonEntries: TooltipEntry[] = boonIds.map((id) => {
    const boon = EnemyBoons[id]
    return { key: `boon-${id}`, label: boon.name, text: boon.tooltipText }
  })
  const entries = [...enchantmentEntries, ...boonEntries]

  const placeTooltip = (e: MouseEvent<HTMLElement>) => {
    if (!entries.length) return
    setTip(relicTooltipViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearTooltip = () => setTip(null)

  if (!entries.length) {
    return className ? <div className={className}>{children}</div> : <>{children}</>
  }

  return (
    <>
      <div className={className} onMouseEnter={placeTooltip} onMouseMove={placeTooltip} onMouseLeave={clearTooltip}>
        {children}
      </div>
      {tip ? <GameTooltipStack entries={entries} x={tip.x} y={tip.y} anchor="topCenter" /> : null}
    </>
  )
}

