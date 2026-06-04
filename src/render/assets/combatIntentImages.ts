import type { EnemyIntentKind } from '../../data/enemyIntentKinds'
import { ENEMY_INTENT_KINDS } from '../../data/enemyIntentKinds'
import attackOnly from '../../assets/images/combatIntents/attackOnly.png'
import buffAttack from '../../assets/images/combatIntents/buffAttack.png'
import buffOnly from '../../assets/images/combatIntents/buffOnly.png'
import debuffAttack from '../../assets/images/combatIntents/debuffAttack.png'
import debuffOnly from '../../assets/images/combatIntents/debuffOnly.png'
import guardAttack from '../../assets/images/combatIntents/guardAttack.png'
import guardOnly from '../../assets/images/combatIntents/guardOnly.png'
import special from '../../assets/images/combatIntents/special.png'

/** Intent icon art keyed by {@link EnemyIntentKind}. */
export const COMBAT_INTENT_IMAGES: Readonly<Record<EnemyIntentKind, string>> = Object.freeze({
  [ENEMY_INTENT_KINDS.attackOnly]: attackOnly,
  [ENEMY_INTENT_KINDS.guardOnly]: guardOnly,
  [ENEMY_INTENT_KINDS.buffOnly]: buffOnly,
  [ENEMY_INTENT_KINDS.debuffOnly]: debuffOnly,
  [ENEMY_INTENT_KINDS.debuffAttack]: debuffAttack,
  [ENEMY_INTENT_KINDS.buffAttack]: buffAttack,
  [ENEMY_INTENT_KINDS.guardAttack]: guardAttack,
  [ENEMY_INTENT_KINDS.special]: special,
})

export function combatIntentImageForKind(kind: EnemyIntentKind): string {
  return COMBAT_INTENT_IMAGES[kind]
}
