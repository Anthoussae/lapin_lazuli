import type { RngState } from '../../core/rng/rng'
import { rngInt, rngNext } from '../../core/rng/rng'
import { rollDice } from '../../core/rng/dice'
import type { EnemyId, PathId } from '../../core/types/ids'
import type { PathCombatPreview } from '../../core/types/state'
import { Enemies } from '../../data/enemies'
import {
  enemyBoonHpMultiplierProduct,
  rollWeightedEnemyBoon,
  rollWeightedEnemyBoonExcluding,
  type EnemyBoonId,
} from '../../data/enemyBoons'

export function isCombatPath(pathId: PathId): boolean {
  return (
    pathId === 'EASY_ENEMY' ||
    pathId === 'MEDIUM_ENEMY' ||
    pathId === 'HARD_ENEMY' ||
    pathId === 'MINIBOSS' ||
    pathId === 'BOSS'
  )
}

/** Boss fights only: closest {@link Enemies}[id].level to `level`, then stable id order. */
export function pickBossEnemyTemplateForLevel(level: number): EnemyId {
  const bosses = (Object.keys(Enemies) as EnemyId[]).filter((id) => Enemies[id]?.boss).sort()
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

/** Boon roll chance for normal combat paths (0–1). Miniboss uses fixed two boons, not this curve. */
function combatPathBoonChance(pathId: PathId, gameLevel: number): number {
  let pct = 0
  if (pathId === 'EASY_ENEMY') pct = gameLevel - 5
  else if (pathId === 'MEDIUM_ENEMY') pct = gameLevel + 5
  else if (pathId === 'HARD_ENEMY') pct = gameLevel * 2 + 5
  else return 0
  return Math.min(1, Math.max(0, pct / 100))
}

export function rollEnemyTemplateForPath(
  rng: RngState,
  level: number,
  pathId: PathId,
): { rng: RngState; enemyTemplateId: EnemyId } {
  const range =
    pathId === 'EASY_ENEMY'
      ? { min: level - 3, max: level }
      : pathId === 'MEDIUM_ENEMY'
        ? { min: level - 1, max: level + 1 }
        : { min: level, max: level + 3 }

  const all = (Object.keys(Enemies) as EnemyId[]).sort()
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
  if (pathId === 'BOSS') {
    enemyTemplateId = pickBossEnemyTemplateForLevel(level)
  } else {
    const t1 = rollEnemyTemplateForPath(r, level, pathId)
    r = t1.rng
    enemyTemplateId = t1.enemyTemplateId
  }

  const boons: EnemyBoonId[] = []
  if (pathId === 'MINIBOSS') {
    const b1 = rollWeightedEnemyBoon(r)
    r = b1.rng
    boons.push(b1.boonId)
    const b2 = rollWeightedEnemyBoonExcluding(r, [b1.boonId])
    r = b2.rng
    boons.push(b2.boonId)
  } else if (pathId === 'EASY_ENEMY' || pathId === 'MEDIUM_ENEMY' || pathId === 'HARD_ENEMY') {
    const p = combatPathBoonChance(pathId, level)
    const [rChance, u] = rngNext(r)
    r = rChance
    if (u < p) {
      const b = rollWeightedEnemyBoon(r)
      r = b.rng
      boons.push(b.boonId)
    }
  }

  const tmpl = Enemies[enemyTemplateId]
  const [r3, rolledHp] = rollDice(r, tmpl.hp)
  r = r3
  const hpMult = enemyBoonHpMultiplierProduct(boons)
  const maxHp = Math.max(1, Math.ceil(rolledHp * hpMult))

  return {
    rng: r,
    preview: { enemyTemplateId, maxHp, boons },
  }
}
