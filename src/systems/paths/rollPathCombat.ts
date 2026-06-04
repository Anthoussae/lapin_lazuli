import type { RngState } from '../../core/rng/rng'
import { rngInt, rngNext } from '../../core/rng/rng'
import { rollDice } from '../../core/rng/dice'
import type { EnemyId, PathId } from '../../core/types/ids'
import type { PathCombatPreview } from '../../core/types/state'
import { Enemies } from '../../data/enemies'
import { Paths } from '../../data/paths'
import {
  enemyBoonHpMultiplierProduct,
  rollWeightedEnemyBoon,
  rollWeightedEnemyBoonExcluding,
  type EnemyBoonId,
} from '../../data/enemyBoons'

export function isCombatPath(pathId: PathId): boolean {
  const k = Paths[pathId]?.kind
  return k === 'combat' || k === 'boss'
}

/** Per-path enemy template level window relative to the current game level (non-boss pool). */
const ENEMY_LEVEL_OFFSET_BY_PATH: Readonly<
  Partial<Record<PathId, Readonly<{ minOffset: number; maxOffset: number }>>>
> = {
  EASY_ENEMY: { minOffset: -3, maxOffset: 0 },
  MEDIUM_ENEMY: { minOffset: -1, maxOffset: 1 },
  HARD_ENEMY: { minOffset: 0, maxOffset: 3 },
  /** Matches prior fallback branch shared with {@link HARD_ENEMY}. */
  MINIBOSS: { minOffset: 0, maxOffset: 3 },
}

export type CombatBoonChanceCurve = Readonly<{ base: number; perLevel: number }>

export type CombatBoonRule =
  | { readonly type: 'none' }
  | { readonly type: 'chanceOne'; readonly curve: CombatBoonChanceCurve }
  | { readonly type: 'minibossTwoUnique' }

const COMBAT_BOON_RULE_BY_PATH: Readonly<Partial<Record<PathId, CombatBoonRule>>> = {
  EASY_ENEMY: { type: 'chanceOne', curve: { base: -5, perLevel: 1 } },
  MEDIUM_ENEMY: { type: 'chanceOne', curve: { base: 5, perLevel: 1 } },
  HARD_ENEMY: { type: 'chanceOne', curve: { base: 5, perLevel: 2 } },
  MINIBOSS: { type: 'minibossTwoUnique' },
}

/** Boon roll chance for normal combat paths (0–1). Miniboss uses fixed two boons, not this curve. */
function combatPathBoonChance(curve: CombatBoonChanceCurve, gameLevel: number): number {
  const pct = curve.perLevel * gameLevel + curve.base
  return Math.min(1, Math.max(0, pct / 100))
}

/** Boss fights only: closest {@link Enemies}[id].level to `level`, then stable id order. */
export function pickBossEnemyTemplateForLevel(level: number): EnemyId {
  const bosses = Object.keys(Enemies)
    .filter((id) => Enemies[id]?.boss)
    .sort()
  if (!bosses.length) return 'CARROT_GOBLIN'

  let picked = bosses[0]!
  let bestDist = Math.abs(Enemies[picked]!.level - level)
  for (const id of bosses) {
    const dist = Math.abs(Enemies[id]!.level - level)
    if (dist < bestDist || (dist === bestDist && id < picked)) {
      picked = id
      bestDist = dist
    }
  }
  return picked
}

export function rollEnemyTemplateForPath(
  rng: RngState,
  level: number,
  pathId: PathId,
): { rng: RngState; enemyTemplateId: EnemyId } {
  const offsets = ENEMY_LEVEL_OFFSET_BY_PATH[pathId] ?? { minOffset: 0, maxOffset: 3 }
  const range = { min: level + offsets.minOffset, max: level + offsets.maxOffset }

  const all = Object.keys(Enemies).sort()
  const rollable = (id: EnemyId) => !Enemies[id]?.boss
  const eligible = all.filter((id) => {
    const e = Enemies[id]
    return rollable(id) && e.level >= range.min && e.level <= range.max
  })
  const fallback = all.filter(rollable)
  const pool = eligible.length ? eligible : fallback

  let r = rng
  const [r2, idx] = rngInt(r, 0, pool.length)
  r = r2
  const picked = pool[idx] ?? pool[0]!
  return { rng: r, enemyTemplateId: picked }
}

/** Rolls template, boon(s) by path rules, and HP (same rules as {@link spawnEnemy}). */
export function rollPathCombatEncounter(
  rng: RngState,
  level: number,
  pathId: PathId,
): { rng: RngState; preview: PathCombatPreview } {
  let r = rng
  let enemyTemplateId: EnemyId
  // Boss paths use scripted boss pool (not the normal level-band enemy table).
  if (Paths[pathId]?.kind === 'boss') {
    enemyTemplateId = pickBossEnemyTemplateForLevel(level)
  } else {
    const t1 = rollEnemyTemplateForPath(r, level, pathId)
    r = t1.rng
    enemyTemplateId = t1.enemyTemplateId
  }

  const boonRule: CombatBoonRule = COMBAT_BOON_RULE_BY_PATH[pathId] ?? { type: 'none' }
  const boons: EnemyBoonId[] = []
  if (boonRule.type === 'minibossTwoUnique') {
    const b1 = rollWeightedEnemyBoon(r, level)
    r = b1.rng
    boons.push(b1.boonId)
    const b2 = rollWeightedEnemyBoonExcluding(r, level, [b1.boonId])
    r = b2.rng
    boons.push(b2.boonId)
  } else if (boonRule.type === 'chanceOne') {
    const p = combatPathBoonChance(boonRule.curve, level)
    const [rChance, u] = rngNext(r)
    r = rChance
    if (u < p) {
      const b = rollWeightedEnemyBoon(r, level)
      r = b.rng
      boons.push(b.boonId)
    }
  }

  const tmpl = Enemies[enemyTemplateId]
  if (tmpl.forceBoon && !boons.includes(tmpl.forceBoon)) boons.push(tmpl.forceBoon)
  const [r3, rolledHp] = rollDice(r, tmpl.hp)
  r = r3
  const hpMult = enemyBoonHpMultiplierProduct(boons, tmpl.level)
  const maxHp = Math.max(1, Math.ceil(rolledHp * hpMult))

  return {
    rng: r,
    preview: { enemyTemplateId, maxHp, boons },
  }
}
