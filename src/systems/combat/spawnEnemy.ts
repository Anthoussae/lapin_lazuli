import type { EnemyId, EnemyInstanceId } from '../../core/types/ids'
import type { EnemyInstance, GameState } from '../../core/types/state'
import { rollDice } from '../../core/rng/dice'
import { Enemies } from '../../data/enemies'
import type { EnemyBoonId } from '../../data/enemyBoons'
import { enemyBoonHpMultiplierProduct, enemyBoonStrengthBonus } from '../../data/enemyBoons'
import { mkEnemyInstance } from '../factories'

export function spawnEnemy(
  state: GameState,
  id: EnemyInstanceId,
  templateId: EnemyId,
  boons: ReadonlyArray<EnemyBoonId> = [],
  opts?: Readonly<{ fixedMaxHp?: number }>,
): { state: GameState; enemy: EnemyInstance } {
  const tmpl = Enemies[templateId]
  const base = mkEnemyInstance(id, templateId)
  let rng2 = state.rng
  let hp: number
  if (opts?.fixedMaxHp !== undefined) {
    hp = Math.max(1, opts.fixedMaxHp)
  } else {
    const hpMult = enemyBoonHpMultiplierProduct(boons)
    const [r, rolledHp] = rollDice(state.rng, tmpl.hp)
    rng2 = r
    hp = Math.max(1, Math.ceil(rolledHp * hpMult))
  }
  const strength = Math.max(0, (tmpl.strength ?? 0) + enemyBoonStrengthBonus(boons))
  const enemy: EnemyInstance = { ...base, hp, maxHp: hp, shield: 0, lockedShield: 0, boons: [...boons], strength }
  return { state: { ...state, rng: rng2 }, enemy }
}

