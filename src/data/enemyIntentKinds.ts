/** UI / rules tags for enemy moves (distinct from execution discriminant `kind: ATTACK | BUFF | …`). */
export const ENEMY_INTENT_KINDS = Object.freeze({
  attackonly: 'attackonly',
  guardonly: 'guardonly',
  buffonly: 'buffonly',
  debuffonly: 'debuffonly',
  debuffattack: 'debuffattack',
  buffattack: 'buffattack',
  guardattack: 'guardattack',
  special: 'special',
} as const)

export type EnemyIntentKind = (typeof ENEMY_INTENT_KINDS)[keyof typeof ENEMY_INTENT_KINDS]

/** Frozen list of every valid intent kind (use for validation, icons, filters). */
export const ENEMY_INTENT_KIND_LIST: ReadonlyArray<EnemyIntentKind> = Object.freeze([
  ENEMY_INTENT_KINDS.attackonly,
  ENEMY_INTENT_KINDS.guardonly,
  ENEMY_INTENT_KINDS.buffonly,
  ENEMY_INTENT_KINDS.debuffonly,
  ENEMY_INTENT_KINDS.debuffattack,
  ENEMY_INTENT_KINDS.buffattack,
  ENEMY_INTENT_KINDS.guardattack,
  ENEMY_INTENT_KINDS.special,
])
