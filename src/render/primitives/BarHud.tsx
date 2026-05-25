import type { GameState } from '../../core/types/state'
import { useHpAfterShieldTicks } from '../hooks/useHpAfterShieldTicks'
import { DEFAULT_TICKING_NUMBER_DURATION_MS } from '../hooks/useTickingNumber'
import { BarDisplay } from './BarDisplay'
import { ShieldIconDisplay } from './ShieldIconDisplay'

export function BarHud(
  props: Readonly<{ state: GameState; inCombat: boolean; className?: string }>,
) {
  const { state, inCombat, className } = props
  const { hp, maxHp, shield, lockedShield } = state.player
  const displayHp = useHpAfterShieldTicks(hp, shield, lockedShield, { enabled: inCombat })
  const tickMs = DEFAULT_TICKING_NUMBER_DURATION_MS

  const rootClass = ['barHud', inCombat ? 'barHud--combat' : '', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} aria-label="Health and shield">
      <div className="barHud__barAnchor">
        <BarDisplay
          label="Health:"
          current={displayHp}
          max={maxHp}
          giltRim
          durationMs={inCombat ? tickMs : undefined}
        />
        {inCombat ? (
          <div className="barHud__shieldIcons barHud__shieldIcons--playerEnd" aria-hidden>
            <ShieldIconDisplay variant="lockedShield" value={lockedShield} durationMs={tickMs} />
            <ShieldIconDisplay variant="shield" value={shield} durationMs={tickMs} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
