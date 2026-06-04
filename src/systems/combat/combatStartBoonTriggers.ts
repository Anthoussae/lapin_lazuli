import { EnemyBoons } from '../../data/enemyBoons'
import type { EnemyBoonId } from '../../data/enemyBoons'
import type { EnemyInstanceId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'

type BoonCarrier = Readonly<{
  id: EnemyInstanceId
  boons: ReadonlyArray<EnemyBoonId>
}>

/** FX events for enemy boons that declare a `combat_start` trigger (e.g. Alchemist deck pulse). */
export function combatStartBoonTriggerEvents(enemies: ReadonlyArray<BoonCarrier>): GameEvent[] {
  const events: GameEvent[] = []
  for (const enemy of enemies) {
    for (const boonId of enemy.boons) {
      const boon = EnemyBoons[boonId]
      if (!boon?.triggers) continue
      for (const trig of boon.triggers) {
        if (trig.on !== 'combat_start') continue
        events.push({
          type: 'EVT/BOON_TRIGGERED',
          enemyId: enemy.id,
          boonId,
          trigger: trig.id,
        })
      }
    }
  }
  return events
}
