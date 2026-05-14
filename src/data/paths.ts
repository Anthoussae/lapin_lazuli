import type { PathId } from '../core/types/ids'

export type PathKind = 'combat' | 'boss' | 'shop' | 'rest' | 'event'

/** Map screen choice → setup phase / flow (see {@link choosePath} in applyAction). */
export type PathMapRoute =
  | 'combat'
  | 'shop'
  | 'rest'
  | 'treasure_room'
  | 'card_reward'
  | 'gemstone_cavern'

/** Post-combat victory reward draft; miniboss/boss use relic triple-offer (see resolveEvents). */
export type PathVictoryRewardKind = 'cards' | 'relics'

export type PathTemplate = Readonly<{
  id: PathId
  kind: PathKind
  /** Where choosing this path routes the game (non-combat paths skip combat preview). */
  mapRoute: PathMapRoute
  /**
   * Combat-only: victory screen offers card picks vs relic picks. Must stay aligned with
   * {@link computeVictoryGoldAndKeys} (relic fights skip RNG key roll and grant a fixed key).
   */
  postCombatRewardKind?: PathVictoryRewardKind
  /**
   * Optional post-combat key chance (0–100 scale before clamp): `basePct + luck * perLuck`.
   * Omitted on paths that never roll the optional post-combat key.
   */
  postVictoryKeyChance?: Readonly<{ basePct: number; perLuck: number }>
  /** When true, path cannot be rolled unless the deck has a socketable card (Gemstone Cavern). */
  requiresSocketableCard?: boolean
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
    kind: 'combat',
    mapRoute: 'combat',
    postCombatRewardKind: 'cards',
    postVictoryKeyChance: { basePct: 10, perLuck: 2 },
    name: 'Combat',
    frequency: 5,
    duplicatesAllowed: true,
    minimumLevel: 0,
    cooldown: 0,
  },
  MEDIUM_ENEMY: {
    id: 'MEDIUM_ENEMY',
    kind: 'combat',
    mapRoute: 'combat',
    postCombatRewardKind: 'cards',
    postVictoryKeyChance: { basePct: 20, perLuck: 3 },
    name: 'Combat',
    frequency: 4,
    duplicatesAllowed: true,
    minimumLevel: 0,
    cooldown: 0,
  },
  HARD_ENEMY: {
    id: 'HARD_ENEMY',
    kind: 'combat',
    mapRoute: 'combat',
    postCombatRewardKind: 'cards',
    postVictoryKeyChance: { basePct: 30, perLuck: 4 },
    name: 'Combat',
    frequency: 3,
    duplicatesAllowed: false,
    minimumLevel: 0,
    cooldown: 0,
  },
  MINIBOSS: {
    id: 'MINIBOSS',
    kind: 'combat',
    mapRoute: 'combat',
    postCombatRewardKind: 'relics',
    name: 'Miniboss',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 6,
    cooldown: 3,
  },
  BOSS: {
    id: 'BOSS',
    kind: 'boss',
    mapRoute: 'combat',
    postCombatRewardKind: 'relics',
    name: 'Boss',
    frequency: 0,
    duplicatesAllowed: false,
    minimumLevel: 15,
    cooldown: 0,
  },
  CARD_REWARD: {
    id: 'CARD_REWARD',
    kind: 'event',
    mapRoute: 'card_reward',
    name: 'Card reward',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 3,
    cooldown: 0,
  },
  REST: {
    id: 'REST',
    kind: 'rest',
    mapRoute: 'rest',
    name: 'Rest',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 5,
    cooldown: 5,
  },
  SHOP: {
    id: 'SHOP',
    kind: 'shop',
    mapRoute: 'shop',
    name: 'Shop',
    frequency: 2,
    duplicatesAllowed: false,
    minimumLevel: 5,
    cooldown: 5,
  },
  TREASURE_ROOM: {
    id: 'TREASURE_ROOM',
    kind: 'event',
    mapRoute: 'treasure_room',
    name: 'Treasure Room',
    frequency: 1,
    duplicatesAllowed: false,
    minimumLevel: 7,
    cooldown: 7,
    alwaysLocked: true,
  },
  GEMSTONE_CAVERN: {
    id: 'GEMSTONE_CAVERN',
    kind: 'event',
    mapRoute: 'gemstone_cavern',
    requiresSocketableCard: true,
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

/** Miniboss / boss paths: relic reward screen and fixed post-fight key (no luck key roll). */
export function pathVictoryOffersRelicPick(pathId: PathId | null | undefined): boolean {
  return pathId != null && Paths[pathId]?.postCombatRewardKind === 'relics'
}

