import type { CSSProperties } from 'react'
import type { EnemyId } from '../core/types/ids'

export type EnemyNameDisplayLayout = Readonly<{
  /** Stacking within the placeholder; default token sits above art. */
  z?: number
  /** Vertical offset in the name transform (e.g. `-90px`; overrides default token when set). */
  y?: string
}>

/** Shared enemy art families (tiered ids like `GOLEM_3` map to `GOLEM`). */
export const ENEMY_KIND_IDS = [
  'CARROT_ORC',
  'DARK_MAGE',
  'GIANT_SKULL',
  'GLORB',
  'GOLEM',
  'MIMIC',
  'MISO_MONSTROSITY',
  'MUSHROOM_LEGIONNAIRE',
  'ONION_GOBLIN',
  'PEAR_HOPLITE',
  'SKELETON_WARRIOR',
  'SOYBEAN_EMPEROR',
  'TOFU_TYRANT',
  'WEIRD',
  'WITCH',
  'WYVERN',
  'ZERRY_CUBE',
] as const

export type EnemyKindId = (typeof ENEMY_KIND_IDS)[number]

/** Maps a combat template id to its shared kind (strips `_0`, `_1`, … tier suffix). */
export function enemyKindFromTemplateId(enemyId: EnemyId): EnemyKindId {
  const match = /^(.+)_(\d+)$/.exec(enemyId)
  return (match ? match[1] : enemyId) as EnemyKindId
}

/** Per-kind combat name label position and stacking (all tiers of a kind share one entry). */
export const ENEMY_NAME_DISPLAY_LAYOUT_BY_KIND: Record<EnemyKindId, EnemyNameDisplayLayout> = {
  CARROT_ORC: {},
  DARK_MAGE: {y: '-20px'},
  GIANT_SKULL: {},
  GLORB: {},
  GOLEM: {y: '-20px'},
  MIMIC: {},
  MISO_MONSTROSITY: {},
  MUSHROOM_LEGIONNAIRE: {},
  ONION_GOBLIN: {},
  PEAR_HOPLITE: {},
  SKELETON_WARRIOR: {},
  SOYBEAN_EMPEROR: {},
  TOFU_TYRANT: {},
  WEIRD: {},
  WITCH: {y: '-20px'},
  WYVERN: {},
  ZERRY_CUBE: {y: '-60px'},
}

function layoutVars(layout: EnemyNameDisplayLayout | undefined): CSSProperties | undefined {
  if (!layout) return undefined
  const style: Record<string, string> = {}
  if (layout.z != null) style['--combat-monster-name-z'] = String(layout.z)
  if (layout.y != null) style['--combat-monster-name-y-offset'] = layout.y
  return Object.keys(style).length ? (style as CSSProperties) : undefined
}

export function enemyNameDisplayLayoutStyle(enemyId: EnemyId | undefined): CSSProperties | undefined {
  if (!enemyId) return undefined
  return layoutVars(ENEMY_NAME_DISPLAY_LAYOUT_BY_KIND[enemyKindFromTemplateId(enemyId)])
}
