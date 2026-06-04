import type { GameState } from '../../core/types/state'
import { useHpAfterShieldTicks } from '../hooks/useHpAfterShieldTicks'
import { DEFAULT_TICKING_NUMBER_DURATION_MS } from '../hooks/useTickingNumber'
import { usePoisonHpBarTint } from '../PoisonHpBarTintContext'
import { useFireHpBarTint } from '../FireHpBarTintContext'
import { BarDisplay } from './BarDisplay'
import { ShieldIconDisplay } from './ShieldIconDisplay'

export function BarHud(
  props: Readonly<{
    state: GameState
    inCombat: boolean
    className?: string
    /** Overrides combat HP tick duration (e.g. lethal drain before player defeat FX). */
    hpTickDurationMs?: number
  }>,
) {
  const { state, inCombat, className, hpTickDurationMs } = props
  const { hp, maxHp, shield, lockedShield } = state.player
  const displayHp = useHpAfterShieldTicks(hp, shield, lockedShield, { enabled: inCombat })
  const tickMs = hpTickDurationMs ?? DEFAULT_TICKING_NUMBER_DURATION_MS
  const poisonTintActive = usePoisonHpBarTint('PLAYER')
  const fireTintActive = useFireHpBarTint('PLAYER')
  const poisonHpDrop = inCombat && poisonTintActive
  const fireHpDrop = inCombat && fireTintActive

  const rootClass = ['barHud', inCombat ? 'barHud--combat' : '', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} aria-label="Health and shield">
      <div className="barHud__barAnchor">
        <BarDisplay
          label="Health:"
          current={displayHp}
          max={maxHp}
          giltRim
          durationMs={inCombat || hpTickDurationMs != null ? tickMs : undefined}
          poisonHpDrop={poisonHpDrop}
          fireHpDrop={fireHpDrop}
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
