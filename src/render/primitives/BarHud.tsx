import type { GameState } from '../../core/types/state'
import { BarDisplay } from './BarDisplay'

export function BarHud(props: Readonly<{ state: GameState; inCombat: boolean }>) {
  const { state, inCombat } = props
  const { hp, maxHp, shield, lockedShield } = state.player
  const showShields = inCombat && (shield > 0 || lockedShield > 0)

  return (
    <div className="barHud" aria-label="Health and shield">
      <BarDisplay label="Health:" current={hp} max={maxHp} giltRim />
      {showShields ? (
        <div className="barHud__shieldText hudText">
          <span className="barHud__shields">Shields: {shield}</span>
          {lockedShield > 0 ? (
            <span className="barHud__lockedShields">Locked Shields: {lockedShield}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
