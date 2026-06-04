import type { EnemyInstanceId } from '../../core/types/ids'
import type { CombatState, GameState } from '../../core/types/state'
import { applyIncomingDamageAndHpLossModifiers } from '../enchantments/incomingDamageModifiers'
import { applyOutgoingDamageAndHpLossModifiers } from '../enchantments/outgoingDamageReduction'
import { applyPlayerDamageThroughShieldsMaybeBubble } from '../enchantments/bubble'
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

/** HP/shield preview after cauldron release (resists applied before shield absorption). */
export function previewEnemyAfterBunnyRelease(
  state: GameState,
  enemyInstanceId: EnemyInstanceId,
  shield: number,
  lockedShield: number,
  hp: number,
  rawBunnyDamage: number,
): { shield: number; lockedShield: number; hp: number } {
  if (rawBunnyDamage <= 0) return { shield, lockedShield, hp }
  const afterOutgoing = applyOutgoingDamageAndHpLossModifiers(state, { kind: 'PLAYER' }, rawBunnyDamage)
  const resolved = applyIncomingDamageAndHpLossModifiers(
    state,
    { kind: 'ENEMY', enemyInstanceId },
    afterOutgoing,
    { damageType: 'BUNNY' },
  )
  const hit = applyPlayerDamageThroughShieldsMaybeBubble(
    state,
    { kind: 'ENEMY', enemyInstanceId },
    shield,
    lockedShield,
    hp,
    resolved,
  )
  return { shield: hit.shield, lockedShield: hit.lockedShield, hp: hit.hp }
}
