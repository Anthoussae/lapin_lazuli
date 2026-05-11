import type { PathId } from '../core/types/ids'

export type PathTemplate = Readonly<{
  id: PathId
  name: string
  frequency: number
  duplicatesAllowed: boolean
  minimumLevel: number
  /** After selecting this path at game level L, it cannot be offered again until level >= L + cooldown. */
  cooldown: number
  /** When true, this path's slot is always treated as locked until the player spends a key (in addition to roll-based locks). */
  alwaysLocked?: boolean
}>

export const Paths: Readonly<Record<PathId, PathTemplate>> = {
  EASY_ENEMY: {
    id: 'EASY_ENEMY',
    name: 'Combat',
    frequency: 5,
    duplicatesAllowed: true,
    minimumLevel: 0,
    cooldown: 0,
  },
  MEDIUM_ENEMY: {
    id: 'MEDIUM_ENEMY',
    name: 'Combat',
    frequency: 4,
    duplicatesAllowed: true,
    minimumLevel: 0,
    cooldown: 0,
  },
  HARD_ENEMY: {
    id: 'HARD_ENEMY',
    name: 'Combat',
    frequency: 3,
    duplicatesAllowed: false,
    minimumLevel: 0,
    cooldown: 0,
  },
  MINIBOSS: {
    id: 'MINIBOSS',
    name: 'Miniboss',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 6,
    cooldown: 3,
  },
  BOSS: {
    id: 'BOSS',
    name: 'Boss',
    frequency: 0,
    duplicatesAllowed: false,
    minimumLevel: 15,
    cooldown: 0,
  },
  CARD_REWARD: {
    id: 'CARD_REWARD',
    name: 'Card reward',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 3,
    cooldown: 0,
  },
  REST: {
    id: 'REST',
    name: 'Rest',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 5,
    cooldown: 5,
  },
  SHOP: {
    id: 'SHOP',
    name: 'Shop',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 5,
    cooldown: 5,
  },
  TREASURE_ROOM: {
    id: 'TREASURE_ROOM',
    name: 'Treasure Room',
    frequency: 1,
    duplicatesAllowed: false,
    minimumLevel: 7,
    cooldown: 7,
    alwaysLocked: true,
  },
  GEMSTONE_CAVERN: {
    id: 'GEMSTONE_CAVERN',
    name: 'Gemstone Cavern',
    frequency: 1,
    duplicatesAllowed: false,
    minimumLevel: 3,
    cooldown: 5,
  },
}

export const PathPool: ReadonlyArray<PathId> = [
  'EASY_ENEMY',
  'MEDIUM_ENEMY',
  'HARD_ENEMY',
  'MINIBOSS',
  'CARD_REWARD',
  'REST',
  'SHOP',
  'TREASURE_ROOM',
  'GEMSTONE_CAVERN',
]

