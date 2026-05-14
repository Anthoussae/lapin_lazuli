import type { EnemyIntent, EnemyIntentEffects, EnemyIntentExtraEffect, GameState } from '../../core/types/state'
import type { DiceSpec } from '../../core/rng/dice'
import { rngInt } from '../../core/rng/rng'
import { rollDice } from '../../core/rng/dice'
import { Enemies } from '../../data/enemies'
import { isEnemyLockedShieldGainDiceRoll } from './intentEffects'

function rollIntentEffects(
  rng: GameState['rng'],
  effects: EnemyIntentEffects | undefined,
): readonly [GameState['rng'], EnemyIntentEffects | undefined] {
  if (!effects?.length) return [rng, effects]
  let nextRng = rng
  const rolled: EnemyIntentExtraEffect[] = []
  for (const fx of effects) {
    if (isEnemyLockedShieldGainDiceRoll(fx)) {
      const [r2, amount] = rollDice(nextRng, fx.roll)
      nextRng = r2
      rolled.push({ effect: 'enemyLockedShieldGain', amount })
    } else {
      rolled.push(fx)
    }
  }
  return [nextRng, rolled]
}

function rollMoveIntent(
  rng: GameState['rng'],
  move: { kind: 'ATTACK'; intentName: string; damage: DiceSpec; effects?: EnemyIntentEffects },
): readonly [GameState['rng'], EnemyIntent] {
  const [rngAfterDamage, dmg] = rollDice(rng, move.damage)
  const [nextRng, effects] = rollIntentEffects(rngAfterDamage, move.effects)
  return [nextRng, { kind: 'ATTACK', intentName: move.intentName, damage: dmg, effects }]
}

export function rollEnemyIntent(state: GameState): GameState {
  if (!state.combat) return state
  let rng = state.rng
  const enemyById = { ...state.combat.enemies.enemyById }
  for (const id of state.combat.enemies.aliveIds) {
    const inst = enemyById[id]
    const tmpl = Enemies[inst.templateId]
    const script = tmpl.intentScript

    if (script?.length) {
      const len = script.length
      const idx = inst.scriptIntentIndex % len
      const step = script[idx]!
      let intent: EnemyIntent
      if (step.kind === 'ATTACK') {
        const [nextRng, rolled] = rollMoveIntent(rng, step)
        rng = nextRng
        intent = rolled
      } else {
        intent = { kind: step.kind, intentName: step.intentName, effects: step.effects }
      }
      enemyById[id] = {
        ...inst,
        intent,
        scriptIntentIndex: (idx + 1) % len,
      }
      continue
    }

    const weighted = tmpl.intents ?? []
    if (!weighted.length) {
      enemyById[id] = { ...inst, intent: { kind: 'WAIT' } }
      continue
    }
    const total = weighted.reduce((acc, i) => acc + i.weight, 0)
    const [r2, n] = rngInt(rng, 0, Math.max(1, total))
    rng = r2
    let cursor = 0
    let picked = weighted[0]
    for (const it of weighted) {
      cursor += it.weight
      if (n < cursor) {
        picked = it
        break
      }
    }
    enemyById[id] = {
      ...inst,
      intent:
        picked?.kind === 'ATTACK'
          ? (() => {
              const [nextRng, rolled] = rollMoveIntent(rng, picked)
              rng = nextRng
              return rolled
            })()
          : picked?.kind === 'BUFF' || picked?.kind === 'DEBUFF'
            ? { kind: picked.kind, intentName: picked.intentName, effects: picked.effects }
            : { kind: 'WAIT' },
    }
  }
  return { ...state, rng, combat: { ...state.combat, enemies: { ...state.combat.enemies, enemyById } } }
}
