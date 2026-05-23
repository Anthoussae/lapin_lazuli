import type { EnemyInstanceId } from '../../core/types/ids'
import type { CombatState } from '../../core/types/state'
import { livingEnemyIds } from './livingEnemies'
import { applyPlayerDamageThroughShields } from './shieldDamage'

/** Enemy that receives end-of-turn bunny damage (selected target, else first living). */
export function bunnyReleaseTargetEnemyId(combat: CombatState): EnemyInstanceId | null {
  const living = livingEnemyIds(combat)
  const selected = combat.targeting.selectedEnemyId
  if (selected && living.includes(selected)) return selected
  return living[0] ?? null
}

export function previewEnemyAfterBunnyDamage(
  shield: number,
  lockedShield: number,
  hp: number,
  damage: number,
): { shield: number; lockedShield: number; hp: number } {
  if (damage <= 0) return { shield, lockedShield, hp }
  const next = applyPlayerDamageThroughShields(shield, lockedShield, hp, damage)
  return { shield: next.shield, lockedShield: next.lockedShield, hp: next.hp }
}
