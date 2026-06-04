/** UI / rules tags for enemy moves (distinct from execution discriminant `kind: ATTACK | BUFF | …`). */
export const ENEMY_INTENT_KINDS = Object.freeze({
  attackOnly: 'attackOnly',
  guardOnly: 'guardOnly',
  buffOnly: 'buffOnly',
  debuffOnly: 'debuffOnly',
  debuffAttack: 'debuffAttack',
  buffAttack: 'buffAttack',
  guardAttack: 'guardAttack',
  special: 'special',
} as const)

export type EnemyIntentKind = (typeof ENEMY_INTENT_KINDS)[keyof typeof ENEMY_INTENT_KINDS]

/** Frozen list of every valid intent kind (use for validation, icons, filters). */
export const ENEMY_INTENT_KIND_LIST: ReadonlyArray<EnemyIntentKind> = Object.freeze([
  ENEMY_INTENT_KINDS.attackOnly,
  ENEMY_INTENT_KINDS.guardOnly,
  ENEMY_INTENT_KINDS.buffOnly,
  ENEMY_INTENT_KINDS.debuffOnly,
  ENEMY_INTENT_KINDS.debuffAttack,
  ENEMY_INTENT_KINDS.buffAttack,
  ENEMY_INTENT_KINDS.guardAttack,
  ENEMY_INTENT_KINDS.special,
])
