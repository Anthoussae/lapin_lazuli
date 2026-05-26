import type { RngState } from '../core/rng/rng'
import { rngInt } from '../core/rng/rng'
import type { CardInstanceId, PathId } from '../core/types/ids'
import type { CardInstance, MysteryRoomState } from '../core/types/state'
import { deckHasSocketableCard } from '../systems/gems/socketing'
import { deckHasPrinterChoice } from '../systems/events/printer'
import { Paths } from './paths'

export type MysteryRoomId =
  | 'FONT_OF_LETHE'
  | 'PRINTER'
  | 'COLLECTOR'
  | 'EASY_ENEMY'
  | 'MEDIUM_ENEMY'
  | 'HARD_ENEMY'
  | 'MINIBOSS'
  | 'CARD_REWARD'
  | 'REST'
  | 'SHOP'
  | 'TREASURE_ROOM'
  | 'GEMSTONE_CAVERN'

export type MysteryRoomKind = 'event' | 'path'

export type MysteryRoomTemplate = Readonly<{
  id: MysteryRoomId
  kind: MysteryRoomKind
  name: string
  frequency: number
  /** Minimum game level required for this room to be eligible. */
  minimumLevel: number
  /** After appearing, this room cannot appear again until `level + cooldown`. */
  cooldown: number
  /** Path outcomes: same flow / rules as choosing this path on the map. */
  pathId?: PathId
}>

export const MysteryRooms: Readonly<Record<MysteryRoomId, MysteryRoomTemplate>> = {
  FONT_OF_LETHE: {
    id: 'FONT_OF_LETHE',
    kind: 'event',
    name: 'Font of Lethe',
    frequency: 3,
    minimumLevel: 0,
    cooldown: 3,
  },
  PRINTER: {
    id: 'PRINTER',
    kind: 'event',
    name: 'The Printer',
    frequency: 200,
    minimumLevel: 0,
    cooldown: 3,
  },
  COLLECTOR: {
    id: 'COLLECTOR',
    kind: 'event',
    name: 'The Collector',
    frequency: 2,
    minimumLevel: 0,
    cooldown: 3,
  },
  EASY_ENEMY: {
    id: 'EASY_ENEMY',
    kind: 'path',
    name: Paths.EASY_ENEMY.name,
    frequency: 3,
    minimumLevel: 0,
    cooldown: 3,
    pathId: 'EASY_ENEMY',
  },
  MEDIUM_ENEMY: {
    id: 'MEDIUM_ENEMY',
    kind: 'path',
    name: Paths.MEDIUM_ENEMY.name,
    frequency: 3,
    minimumLevel: 0,
    cooldown: 3,
    pathId: 'MEDIUM_ENEMY',
  },
  HARD_ENEMY: {
    id: 'HARD_ENEMY',
    kind: 'path',
    name: Paths.HARD_ENEMY.name,
    frequency: 2,
    minimumLevel: 0,
    cooldown: 3,
    pathId: 'HARD_ENEMY',
  },
  MINIBOSS: {
    id: 'MINIBOSS',
    kind: 'path',
    name: Paths.MINIBOSS.name,
    frequency: 1,
    minimumLevel: 4,
    cooldown: 3,
    pathId: 'MINIBOSS',
  },
  CARD_REWARD: {
    id: 'CARD_REWARD',
    kind: 'path',
    name: Paths.CARD_REWARD.name,
    frequency: 2,
    minimumLevel: 0,
    cooldown: 3,
    pathId: 'CARD_REWARD',
  },
  REST: {
    id: 'REST',
    kind: 'path',
    name: Paths.REST.name,
    frequency: 2,
    minimumLevel: 3,
    cooldown: 3,
    pathId: 'REST',
  },
  SHOP: {
    id: 'SHOP',
    kind: 'path',
    name: Paths.SHOP.name,
    frequency: 2,
    minimumLevel: 5,
    cooldown: 3,
    pathId: 'SHOP',
  },
  TREASURE_ROOM: {
    id: 'TREASURE_ROOM',
    kind: 'path',
    name: Paths.TREASURE_ROOM.name,
    frequency: 1,
    minimumLevel: 5,
    cooldown: 5,
    pathId: 'TREASURE_ROOM',
  },
  GEMSTONE_CAVERN: {
    id: 'GEMSTONE_CAVERN',
    kind: 'path',
    name: Paths.GEMSTONE_CAVERN.name,
    frequency: 1,
    minimumLevel: 5,
    cooldown: 5,
    pathId: 'GEMSTONE_CAVERN',
  },
}

/** Font of Lethe requires forgetting a card; offer only when the deck is large enough. */
export const FONT_OF_LETHE_MIN_DECK_SIZE = 5

export function fontOfLetheOfferable(cardById: Readonly<Record<CardInstanceId, CardInstance>>): boolean {
  return Object.keys(cardById).length >= FONT_OF_LETHE_MIN_DECK_SIZE
}

export const MysteryRoomPool: ReadonlyArray<MysteryRoomId> = [
  'FONT_OF_LETHE',
  'PRINTER',
  'COLLECTOR',
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

export function mysteryRoomIsEvent(roomId: MysteryRoomId): boolean {
  return MysteryRooms[roomId]?.kind === 'event'
}

export function mysteryRoomPathId(roomId: MysteryRoomId): PathId | null {
  const room = MysteryRooms[roomId]
  return room?.kind === 'path' ? (room.pathId ?? null) : null
}

function mysteryRoomPoolAtLevel(
  level: number,
  cardById: Readonly<Record<CardInstanceId, CardInstance>>,
  roomCooldownUntil: Readonly<Partial<Record<MysteryRoomId, number>>>,
): ReadonlyArray<MysteryRoomId> {
  const gemstoneCavernOfferable = deckHasSocketableCard(cardById)
  const fontOfLetheOfferableNow = fontOfLetheOfferable(cardById)
  return MysteryRoomPool.filter((id) => {
    const room = MysteryRooms[id]
    if (!room) return false
    if (room.minimumLevel > level) return false
    const until = roomCooldownUntil[id]
    if (until !== undefined && level < until) return false
    if (id === 'FONT_OF_LETHE' && !fontOfLetheOfferableNow) return false
    if (id === 'PRINTER' && !deckHasPrinterChoice(cardById)) return false
    const pathId = room.pathId
    if (!pathId) return true
    const path = Paths[pathId]
    if (!path || path.minimumLevel > level) return false
    if (path.requiresSocketableCard && !gemstoneCavernOfferable) return false
    return true
  })
}

/** Weighted mystery room roll (same RNG contract as path / boon picks). */
export function rollMysteryRoom(
  rng: RngState,
  level: number,
  cardById: Readonly<Record<CardInstanceId, CardInstance>>,
  roomCooldownUntil: Readonly<Partial<Record<MysteryRoomId, number>>>,
): { rng: RngState; roomId: MysteryRoomId } {
  const pool = mysteryRoomPoolAtLevel(level, cardById, roomCooldownUntil)
  const total = pool.reduce((acc, id) => acc + Math.max(0, MysteryRooms[id]?.frequency ?? 0), 0)
  const span = Math.max(1, total)
  const [r2, n] = rngInt(rng, 0, span)
  let cursor = 0
  let picked: MysteryRoomId = pool[0] ?? 'PRINTER'
  for (const id of pool) {
    cursor += Math.max(0, MysteryRooms[id]?.frequency ?? 0)
    if (n < cursor) {
      picked = id
      break
    }
  }
  return { rng: r2, roomId: picked }
}

export function mysteryRoomDisplay(roomId: MysteryRoomId): Readonly<{ name: string }> {
  const room = MysteryRooms[roomId]
  return { name: room?.name ?? roomId }
}

export function mkMysteryRoomState(roomId: MysteryRoomId): MysteryRoomState {
  if (roomId === 'FONT_OF_LETHE') {
    return {
      roomId,
      fontOfLethe: { selectedCardInstanceId: null, cardForgotten: false },
    }
  }
  if (roomId === 'PRINTER') {
    return {
      roomId,
      printer: {
        selectedCardInstanceId: null,
        duplicateSelectedCardInstanceId: null,
        cardFoiled: false,
        cardDuplicated: false,
      },
    }
  }
  return { roomId }
}
