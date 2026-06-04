import type { EnemyId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { rngNext } from '../../core/rng/rng'
import { Enemies } from '../../data/enemies'
import { Relics } from '../../data/relics'

/** Maximum dodge chance from any source or combination of effects. */
export const MAX_DODGE_CHANCE = 0.5

export function capDodgeChance(chance: number): number {
  if (chance <= 0) return 0
  return Math.min(MAX_DODGE_CHANCE, chance)
}

/** Sum of `DODGE` chances from relics with `onReceivingAttack` (capped at {@link MAX_DODGE_CHANCE}). */
export function playerDodgeChanceFromRelics(state: GameState): number {
  let total = 0
  for (const rInst of state.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onReceivingAttack') continue
      if (trig.effect.kind !== 'DODGE') continue
      total += trig.effect.chance
    }
  }
  return capDodgeChance(total)
}

export function enemyDodgeChance(templateId: EnemyId): number {
  const chance = Enemies[templateId]?.dodgeChance
  return chance != null && chance > 0 ? capDodgeChance(chance) : 0
}

export function rollDodge(
  state: GameState,
  chance: number,
): Readonly<{ state: GameState; dodged: boolean }> {
  chance = capDodgeChance(chance)
  if (chance <= 0) return { state, dodged: false }
  if (chance >= 1) return { state, dodged: true }
  const [nextRng, roll] = rngNext(state.rng)
  return { state: { ...state, rng: nextRng }, dodged: roll < chance }
}
