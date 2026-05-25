import { useHpAfterShieldTicks } from '../hooks/useHpAfterShieldTicks'
import { DEFAULT_TICKING_NUMBER_DURATION_MS } from '../hooks/useTickingNumber'
import { BarDisplay } from './BarDisplay'
import { ShieldIconDisplay } from './ShieldIconDisplay'

export type CombatEnemyBarHudProps = Readonly<{
  hp: number
  maxHp: number
  shield: number
  lockedShield: number
  durationMs?: number
  leapTargetRef?: (el: HTMLElement | null) => void
}>

export function CombatEnemyBarHud(props: CombatEnemyBarHudProps) {
  const { hp, maxHp, shield, lockedShield, durationMs, leapTargetRef } = props
  const tickMs = durationMs ?? DEFAULT_TICKING_NUMBER_DURATION_MS
  const displayHp = useHpAfterShieldTicks(hp, shield, lockedShield, { enabled: true, durationMs: tickMs })

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
        />
        <div className="barHud__shieldIcons barHud__shieldIcons--monsterEnd" aria-hidden>
          <ShieldIconDisplay variant="shield" value={shield} durationMs={tickMs} />
          <ShieldIconDisplay variant="lockedShield" value={lockedShield} durationMs={tickMs} />
        </div>
      </div>
    </div>
  )
}
