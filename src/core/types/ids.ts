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
  | 'BUBBLE_WAND'
  | 'RED_HAT'
  | 'GREEN_HAT'
  | 'PURPLE_HAT'
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
  | 'GLADIATOR_HELMET'
  | 'BLUE_ROSE'
  | 'PET_ROCK'
  | 'EMBERS'
  | 'MONOCLE'
  | 'HAND_OF_FATIMA'
  | 'PEACOCK_FEATHER'
  | 'HOURGLASS'
export type EnemyId = string
/** Canonical enemy intent template ids from data/enemyIntents.ts. */
export type EnemyIntentId =
  | 'SMALL_ATTACK'
  | 'SMALL_SHIELD_BASH'
  | 'SMALL_DEFEND'
  | 'SMALL_VAMPIRIC_ATTACK'
  | 'SMALL_FURY_SWIPES'
  | 'SMALL_SMOKE_ATTACK'
  | 'SMALL_DIZZYING_BLOW'
  | 'WEAKENING_BLOW'
  | 'RUSTING_BLOW'
  | 'AMPLIFYING_BLOW'
  | 'SMALL_POISON_CURSE'
  | 'BLOW_SMOKE'
  | 'SMALL_CHARGE_UP'
  | 'MEDIUM_CHARGE_UP'
  | 'LARGE_CHARGE_UP'
  | 'SMALL_PREPARE'
  | 'MEDIUM_PREPARE'
  | 'MEDIUM_ATTACK'
  | 'MEDIUM_DEFEND'
  | 'LARGE_ATTACK'
  | 'LARGE_DEFEND'
  | 'AMPLIFY_DAMAGE'
  | 'WEAKEN'
  | 'RUST'
  | 'OMNICURSE'
export type PathId = string
export type EnchantmentId = string

export type CardInstanceId = Id
export type RelicInstanceId = Id
export type EnemyInstanceId = Id
export type CombatId = Id
export type EnchantmentInstanceId = Id
