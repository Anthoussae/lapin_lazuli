import type { EnemyId, EnemyInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { Enemies } from '../../data/enemies'
import { enemyCombatStartEnchantmentGrants, type EnemyBoonId } from '../../data/enemyBoons'
import { grantEnchantmentStacks } from '../enchantments/grantEnchantmentStacks'

/** Applies combat-start enchantment grants from an enemy's boons onto that enemy. */
export function applyCombatStartBoonEnchantments(
  state: GameState,
  enemyInstanceId: EnemyInstanceId,
  templateId: EnemyId,
  boons: ReadonlyArray<EnemyBoonId>,
): GameState {
  let s = state
  const target = { kind: 'ENEMY' as const, enemyInstanceId }
  const owner = { kind: 'ENEMY' as const, enemyInstanceId }
  const enemyLevel = Enemies[templateId]?.level ?? 0

  for (const grant of enemyCombatStartEnchantmentGrants(boons, enemyLevel)) {
    s = grantEnchantmentStacks(s, {
      templateId: grant.enchantmentId,
      target,
      owner,
      stacks: grant.amount,
    })
  }
  return s
}
