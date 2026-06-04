import { useState, type MouseEvent, type ReactNode } from 'react'
import type { EnemyBoonId } from '../../data/enemyBoons'
import { EnemyBoons, enemyBoonTooltipText } from '../../data/enemyBoons'
import { relicTooltipViewportPosition } from '../relicTooltipPosition'
import { GameTooltipStack } from './GameTooltip'

import type { GameTooltipEntry } from './GameTooltip'

type TooltipEntry = GameTooltipEntry

type CombatTargetHoverHostProps = Readonly<{
  boonIds?: ReadonlyArray<EnemyBoonId>
  enemyLevel?: number
  strength?: number
  enchantmentEntries?: ReadonlyArray<TooltipEntry>
  children: ReactNode
  className?: string
}>

export function CombatTargetHoverHost(props: CombatTargetHoverHostProps) {
  const { boonIds = [], enemyLevel = 0, strength = 0, enchantmentEntries = [], children, className } = props
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)

  const strengthEntry: TooltipEntry[] =
    strength > 0 ? [{ key: 'strength', label: `+${strength} Strength` }] : []
  const boonEntries: TooltipEntry[] = boonIds
    .filter((id) => !EnemyBoons[id].combatStartEnchantment)
    .map((id) => {
      const boon = EnemyBoons[id]
      return { key: `boon-${id}`, label: boon.name, text: enemyBoonTooltipText(id, enemyLevel) }
    })
  const entries = [...enchantmentEntries, ...strengthEntry, ...boonEntries]
  const hasHover = entries.length > 0

  const placeTooltip = (e: MouseEvent<HTMLElement>) => {
    if (!hasHover) return
    setTip(relicTooltipViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearTooltip = () => setTip(null)

  // Keep a stable wrapper div whenever `className` is set so children (e.g. bubble pop
  // detectors keyed on enchantment stack diffs) are not remounted when the last tooltip
  // entry disappears.
  if (!className && !hasHover) {
    return <>{children}</>
  }

  return (
    <>
      <div
        className={className}
        onMouseEnter={hasHover ? placeTooltip : undefined}
        onMouseMove={hasHover ? placeTooltip : undefined}
        onMouseLeave={hasHover ? clearTooltip : undefined}
      >
        {children}
      </div>
      {tip ? <GameTooltipStack entries={entries} x={tip.x} y={tip.y} anchor="topCenter" /> : null}
    </>
  )
}

