import type { PathId } from '../core/types/ids'
import { Paths } from '../data/paths'
import {
  bossDoor,
  cardDoor,
  fallbackDoor,
  gemDoor,
  monsterDoor,
  openBossDoor,
  openDoor,
  restDoor,
  shopDoor,
  treasureDoor,
} from './assets/doorImages'

const PATH_DOOR_BY_ID: Readonly<Partial<Record<PathId, string>>> = {
  CARD_REWARD: cardDoor,
  REST: restDoor,
  SHOP: shopDoor,
  TREASURE_ROOM: treasureDoor,
  GEMSTONE_CAVERN: gemDoor,
}

export function pathDoorArt(pathId: PathId): string {
  const kind = Paths[pathId]?.kind
  if (kind === 'boss') return bossDoor
  if (kind === 'combat') return monsterDoor
  return PATH_DOOR_BY_ID[pathId] ?? fallbackDoor
}

export function pathOpenDoorArt(pathId: PathId): string {
  const kind = Paths[pathId]?.kind
  if (kind === 'boss') return openBossDoor
  return openDoor
}

export type PathDoorGlowTone = 'combat' | 'shop' | 'rest' | 'default'

export function pathDoorGlowTone(pathId: PathId): PathDoorGlowTone {
  const kind = Paths[pathId]?.kind
  if (kind === 'combat' || kind === 'boss') return 'combat'
  if (kind === 'shop') return 'shop'
  if (kind === 'rest') return 'rest'
  return 'default'
}
