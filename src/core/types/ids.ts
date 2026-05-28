export type Id = string

export type CardId = string
export type GemId = string
/** Canonical relic template ids — SCREAMING_SNAKE derived from relic display names in data/relics.ts. */
export type RelicId =
  | 'KEYCHAIN'
  | 'ETERNAL_INKSTONE'
  | 'HYDRANGEA'
  | 'ARCANE_SCROLL'
  | 'MAGIC_STAFF'
  | 'GOLD_INGOT'
  | 'MAGIC_WAND'
  | 'ENCHANTED_ENCYCLOPAEDIA'
  | 'NAZAR'
  | 'LUCKY_EGG'
  | 'SHAKUJO'
  | 'BANANA'
  | 'RED_HAT'
  | 'GREEN_HAT'
  | 'PHOENIX_FEATHER_QUILL'
  | 'MAGES_TOME'
  | 'PAPER_BOAT'
  | 'NURSES_HAT'
  | 'POCKET_MOON'
  | 'TAROT_DECK'
  | 'ORCHID'
  | 'PAINTBRUSH'
  | 'BACKPACK'
  | 'RYO'
  | 'WOODEN_SHIELD'
  | 'COPPER_ALEMBICS'
  | 'SPRIG_OF_WOLFSBANE'
export type EnemyId = string
export type PathId = string
export type EnchantmentId = string

export type CardInstanceId = Id
export type RelicInstanceId = Id
export type EnemyInstanceId = Id
export type CombatId = Id
export type EnchantmentInstanceId = Id
