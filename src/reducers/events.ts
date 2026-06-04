import type { CardInstanceId, EnemyInstanceId, EnchantmentId, RelicId } from '../core/types/ids'
import type { EnemyBoonId } from '../data/enemyBoons'

export type GameEvent =
  | { type: 'EVT/CARD_PLAYED'; cardInstanceId: CardInstanceId }
  | { type: 'EVT/CARD_PHASED_OUT'; cardInstanceId: CardInstanceId }
  | { type: 'EVT/CARD_PHASED_IN'; cardInstanceId: CardInstanceId }
  | { type: 'EVT/ENERGY_SPENT'; amount: number }
  | { type: 'EVT/PLAYER_HIT'; amount: number }
  | { type: 'EVT/PLAYER_UNBLOCKED_DAMAGE'; source: 'ENEMY'; amount: number }
  | { type: 'EVT/UNIT_DIED'; unit: 'PLAYER' | EnemyInstanceId }
  | { type: 'EVT/TURN_ENDED'; by: 'PLAYER' | 'ENEMIES' }
  | { type: 'EVT/BUNNIES_RELEASING'; count: number }
  | { type: 'EVT/COMBAT_ENDED'; result: 'VICTORY' | 'DEFEAT' }
  | { type: 'EVT/RELIC_TRIGGERED'; relicId: RelicId; trigger: string }
  | {
      type: 'EVT/BOON_TRIGGERED'
      enemyId: EnemyInstanceId
      boonId: EnemyBoonId
      trigger: string
      /** Hand cards that receive debuff trigger FX (e.g. Disabling boon). */
      targetCardInstanceIds?: ReadonlyArray<CardInstanceId>
    }
  | { type: 'EVT/CRITICAL_HIT'; variant: 'attack' | 'bunnies' | 'shield'; multiplierPercent: number }
  | { type: 'EVT/PLAYER_DODGED' }
  | {
      type: 'EVT/ENCHANTMENT_TRIGGERED'
      enchantmentId: EnchantmentId
      unit: 'PLAYER' | EnemyInstanceId
    }
  | {
      type: 'EVT/POISON_CARD_HP_LOSS'
      unit: 'PLAYER' | EnemyInstanceId
      cardInstanceId: CardInstanceId
    }
  | {
      type: 'EVT/FIRE_DAMAGE_RECEIVED'
      unit: 'PLAYER' | EnemyInstanceId
      hpDecreased: boolean
    }

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
    case 'EVT/PLAYER_UNBLOCKED_DAMAGE':
      return `PLAYER_UNBLOCKED_DAMAGE ${e.source} ${e.amount}`
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
    case 'EVT/BOON_TRIGGERED': {
      const cards = e.targetCardInstanceIds?.length ? ` cards:${e.targetCardInstanceIds.join(',')}` : ''
      return `BOON ${e.enemyId} ${e.boonId} (${e.trigger})${cards}`
    }
    case 'EVT/CRITICAL_HIT':
      return `CRITICAL_HIT ${e.variant} ${e.multiplierPercent}`
    case 'EVT/PLAYER_DODGED':
      return 'PLAYER_DODGED'
    case 'EVT/ENCHANTMENT_TRIGGERED':
      return `ENCHANTMENT ${e.enchantmentId} ${e.unit}`
    case 'EVT/POISON_CARD_HP_LOSS':
      return `POISON_CARD_HP_LOSS ${e.unit} ${e.cardInstanceId}`
    case 'EVT/FIRE_DAMAGE_RECEIVED':
      return `FIRE_DAMAGE_RECEIVED ${e.unit} ${e.hpDecreased ? 1 : 0}`
    default:
      return 'EVT'
  }
}

