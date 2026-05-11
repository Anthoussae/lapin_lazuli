import type { CardId, CardInstanceId, EnemyId, EnemyInstanceId, RelicId } from '../core/types/ids'
import type { CardInstance, EnemyInstance, RelicInstance } from '../core/types/state'

export function mkCardInstance(id: CardInstanceId, templateId: CardId, upgrades = 0): CardInstance {
  return { id, templateId, upgrades, exhausted: false, costOverride: null, socketedGemId: null, unsocketable: false }
}

export function mkRelicInstance(id: string, templateId: RelicId): RelicInstance {
  return { id, templateId, counters: {} }
}

export function mkEnemyInstance(id: EnemyInstanceId, templateId: EnemyId): EnemyInstance {
  // hp/maxHp/strength are finalized by spawn system from template.
  return {
    id,
    templateId,
    hp: 1,
    maxHp: 1,
    shield: 0,
    lockedShield: 0,
    boons: [],
    strength: 0,
    intent: null,
    scriptIntentIndex: 0,
    powers: {},
  }
}

