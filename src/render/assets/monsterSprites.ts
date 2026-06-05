import monsterPlaceholder1 from '../../assets/images/monsters/monsterPlaceholder1.png'
import carrotmonster from '../../assets/images/monsters/carrotmonster.png'
import dragon from '../../assets/images/monsters/dragon.png'
import giantSkull from '../../assets/images/monsters/giantSkull.png'
import glorb from '../../assets/images/monsters/glorb.png'
import golem from '../../assets/images/monsters/golem.png'
import gelatinousCube from '../../assets/images/monsters/gelatinousCube.png'
import mimic from '../../assets/images/monsters/mimic.png'
import mushroom from '../../assets/images/monsters/mushroom.png'
import onionmonster from '../../assets/images/monsters/onionmonster.png'
import pearHoplite from '../../assets/images/monsters/pearHoplite.png'
import skeleton from '../../assets/images/monsters/skeleton.png'
import tofuTyrant from '../../assets/images/monsters/tofuTyrant.png'
import witch from '../../assets/images/monsters/witch.png'
import wizard from '../../assets/images/monsters/wizard.png'
import weird from '../../assets/images/monsters/weird.png'
import wyvern from '../../assets/images/monsters/wyvern.png'

/** Default combat monster art when no named sprite is registered. */
export const MONSTER_PLACEHOLDER_SPRITE = monsterPlaceholder1

/** Maps PNG filename → bundled URL under assets/images/monsters/. */
export const MONSTER_SPRITES_BY_FILENAME: Readonly<Record<string, string>> = {
  'carrotmonster.png': carrotmonster,
  'dragon.png': dragon,
  'giantSkull.png': giantSkull,
  'glorb.png': glorb,
  'golem.png': golem,
  'gelatinousCube.png': gelatinousCube,
  'mimic.png': mimic,
  'mushroom.png': mushroom,
  'onionmonster.png': onionmonster,
  'pearHoplite.png': pearHoplite,
  'skeleton.png': skeleton,
  'skeletonwarrior.png': skeleton,
  'tofuTyrant.png': tofuTyrant,
  'witch.png': witch,
  'weird.png': weird,
  'wizard.png': wizard,
  'wyvern.png': wyvern,
}

/** Resolves combat monster art from template sprite filename; falls back to placeholder. */
export function monsterSpriteForFilename(filename: string | undefined): string {
  if (filename == null) return MONSTER_PLACEHOLDER_SPRITE
  return MONSTER_SPRITES_BY_FILENAME[filename] ?? MONSTER_PLACEHOLDER_SPRITE
}

export const MONSTER_PRELOAD_URLS: readonly string[] = [
  MONSTER_PLACEHOLDER_SPRITE,
  ...Object.values(MONSTER_SPRITES_BY_FILENAME),
]
