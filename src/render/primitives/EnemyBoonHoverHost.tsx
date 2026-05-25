import { useState, type MouseEvent, type ReactNode } from 'react'
import type { EnemyBoonId } from '../../data/enemyBoons'
import { EnemyBoonTooltips, enemyBoonTooltipsViewportPosition } from './EnemyBoonTooltips'

type EnemyBoonHoverHostProps = Readonly<{
  boonIds: ReadonlyArray<EnemyBoonId>
  children: ReactNode
  className?: string
}>

export function EnemyBoonHoverHost(props: EnemyBoonHoverHostProps) {
  const { boonIds, children, className } = props
  const [tip, setTip] = useState<null | { x: number; y: number }>(null)

  const placeTooltip = (e: MouseEvent<HTMLElement>) => {
    if (!boonIds.length) return
    setTip(enemyBoonTooltipsViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearTooltip = () => setTip(null)

  if (!boonIds.length) {
    return className ? <div className={className}>{children}</div> : <>{children}</>
  }

  return (
    <>
      <div
        className={className}
        onMouseEnter={placeTooltip}
        onMouseMove={placeTooltip}
        onMouseLeave={clearTooltip}
      >
        {children}
      </div>
      {tip ? <EnemyBoonTooltips boonIds={boonIds} x={tip.x} y={tip.y} /> : null}
    </>
  )
}
