import type { EnemyInstanceId } from '../../core/types/ids'
import { usePoisonHpBarTint } from '../PoisonHpBarTintContext'
import { useFireHpBarTint } from '../FireHpBarTintContext'
import { useHpAfterShieldTicks } from '../hooks/useHpAfterShieldTicks'
import { DEFAULT_TICKING_NUMBER_DURATION_MS } from '../hooks/useTickingNumber'
import { BarDisplay } from './BarDisplay'
import { ShieldIconDisplay } from './ShieldIconDisplay'

export type CombatEnemyBarHudProps = Readonly<{
  enemyInstanceId: EnemyInstanceId
  hp: number
  maxHp: number
  shield: number
  lockedShield: number
  durationMs?: number
  leapTargetRef?: (el: HTMLElement | null) => void
}>

export function CombatEnemyBarHud(props: CombatEnemyBarHudProps) {
  const { enemyInstanceId, hp, maxHp, shield, lockedShield, durationMs, leapTargetRef } = props
  const tickMs = durationMs ?? DEFAULT_TICKING_NUMBER_DURATION_MS
  const poisonHpDrop = usePoisonHpBarTint(enemyInstanceId)
  const fireHpDrop = useFireHpBarTint(enemyInstanceId)
  const displayHp = useHpAfterShieldTicks(hp, shield, lockedShield, { enabled: true, durationMs: tickMs })
  const dualShieldLayout = shield > 0 && lockedShield > 0
  const shieldIconsClass = [
    'barHud__shieldIcons',
    'barHud__shieldIcons--monsterEnd',
    dualShieldLayout ? 'barHud__shieldIcons--dual' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={leapTargetRef}
      className="barHud barHud--combat combatMonsterBarHud"
      aria-label="Enemy health and shield"
    >
      <div className="barHud__barAnchor">
        <BarDisplay
          label="Health:"
          current={displayHp}
          max={maxHp}
          giltRim
          durationMs={tickMs}
          poisonHpDrop={poisonHpDrop}
          fireHpDrop={fireHpDrop}
        />
        <div className={shieldIconsClass} aria-hidden>
          <ShieldIconDisplay variant="lockedShield" value={lockedShield} durationMs={tickMs} />
          <ShieldIconDisplay variant="shield" value={shield} durationMs={tickMs} />
        </div>
      </div>
    </div>
  )
}
