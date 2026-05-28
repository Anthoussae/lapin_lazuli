import type { CardInstanceId, EnemyInstanceId, RelicId } from '../core/types/ids'
import type { EnemyBoonId } from '../data/enemyBoons'

export type GameEvent =
  | { type: 'EVT/CARD_PLAYED'; cardInstanceId: CardInstanceId }
  | { type: 'EVT/CARD_PHASED_OUT'; cardInstanceId: CardInstanceId }
  | { type: 'EVT/CARD_PHASED_IN'; cardInstanceId: CardInstanceId }
  | { type: 'EVT/ENERGY_SPENT'; amount: number }
  | { type: 'EVT/PLAYER_HIT'; amount: number }
  | { type: 'EVT/UNIT_DIED'; unit: 'PLAYER' | EnemyInstanceId }
  | { type: 'EVT/TURN_ENDED'; by: 'PLAYER' | 'ENEMIES' }
  | { type: 'EVT/BUNNIES_RELEASING'; count: number }
  | { type: 'EVT/COMBAT_ENDED'; result: 'VICTORY' | 'DEFEAT' }
  | { type: 'EVT/RELIC_TRIGGERED'; relicId: RelicId; trigger: string }
  | { type: 'EVT/BOON_TRIGGERED'; enemyId: EnemyInstanceId; boonId: EnemyBoonId; trigger: string }

export function eventToString(e: GameEvent): string {
  switch (e.type) {
    case 'EVT/CARD_PLAYED':
      return `CARD_PLAYED ${e.cardInstanceId}`
    case 'EVT/CARD_PHASED_OUT':
      return `CARD_PHASED_OUT ${e.cardInstanceId}`
    case 'EVT/CARD_PHASED_IN':
      return `CARD_PHASED_IN ${e.cardInstanceId}`
    case 'EVT/ENERGY_SPENT':
      return `ENERGY_SPENT ${e.amount}`
    case 'EVT/PLAYER_HIT':
      return `PLAYER_HIT ${e.amount}`
    case 'EVT/UNIT_DIED':
      return `DIED ${String(e.unit)}`
    case 'EVT/TURN_ENDED':
      return `TURN_ENDED ${e.by}`
    case 'EVT/BUNNIES_RELEASING':
      return `BUNNIES_RELEASING ${e.count}`
    case 'EVT/COMBAT_ENDED':
      return `COMBAT_ENDED ${e.result}`
    case 'EVT/RELIC_TRIGGERED':
      return `RELIC ${e.relicId} (${e.trigger})`
    case 'EVT/BOON_TRIGGERED':
      return `BOON ${e.enemyId} ${e.boonId} (${e.trigger})`
    default:
      return 'EVT'
  }
}

