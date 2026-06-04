import type { EnemyInstanceId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'

type UnitVitals = Readonly<{ hp: number; shield: number; lockedShield: number }>

/** Emits {@link EVT/FIRE_DAMAGE_RECEIVED} when fire damage reduced shields and/or HP. */
export function pushFireDamageReceivedEvent(
  events: GameEvent[],
  unit: 'PLAYER' | EnemyInstanceId,
  before: UnitVitals,
  after: UnitVitals,
): void {
  const hpDecreased = after.hp < before.hp
  const damageApplied =
    hpDecreased || after.shield < before.shield || after.lockedShield < before.lockedShield
  if (!damageApplied) return
  events.push({ type: 'EVT/FIRE_DAMAGE_RECEIVED', unit, hpDecreased })
}
