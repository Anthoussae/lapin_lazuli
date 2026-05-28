import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnchantmentInstance } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import { rngInt } from '../../core/rng/rng'
import { applyStaticEnchantmentOnRemove } from './staticEffects'

export type DispelCaster = Readonly<{ kind: 'PLAYER' } | { kind: 'ENEMY'; enemyInstanceId: EnemyInstanceId }>

export function dispelOpponentEnchantments(
  state: GameState,
  amount: number,
  caster: DispelCaster,
): GameState {
  if (amount <= 0) return state
  const combat = state.combat
  if (!combat) return state

  const opponentOwned = (e: EnchantmentInstance): boolean => {
    if (caster.kind === 'PLAYER') return e.owner.kind === 'ENEMY'
    return e.owner.kind === 'PLAYER'
  }

  let s: GameState = state
  let r = state.rng
  let ench = [...combat.enchantments]

  let remaining = Math.max(0, amount | 0)
  while (remaining > 0) {
    const candidates = ench.map((e, idx) => ({ e, idx })).filter((x) => opponentOwned(x.e))
    if (!candidates.length) break
    const [r2, pick] = rngInt(r, 0, candidates.length)
    r = r2
    const picked = candidates[pick]
    if (!picked) break
    s = applyStaticEnchantmentOnRemove(s, picked.e)
    ench.splice(picked.idx, 1)
    remaining -= 1
  }

  const combatNow = s.combat
  if (!combatNow) return { ...s, rng: r }
  return { ...s, rng: r, combat: { ...combatNow, enchantments: ench } }
}

