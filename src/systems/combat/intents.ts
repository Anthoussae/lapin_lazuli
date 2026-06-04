import type { EnemyIntent, EnemyIntentEffects, EnemyIntentExtraEffect, GameState } from '../../core/types/state'
import type { DiceSpec } from '../../core/rng/dice'
import { rngInt } from '../../core/rng/rng'
import { rollDice } from '../../core/rng/dice'
import { Enemies, type EnemyIntentEntry, type EnemyTemplate } from '../../data/enemies'
import { ENEMY_INTENT_KINDS } from '../../data/enemyIntentKinds'
import {
  EnemyIntents,
  resolveEnemyIntentDefForLevel,
  type ResolvedEnemyIntentMove,
} from '../../data/enemyIntents'
import type { EnemyIntentId } from '../../core/types/ids'
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
  move: {
    kind: 'ATTACK'
    intentKind: EnemyIntent['intentKind']
    intentName: string
    damage: DiceSpec
    effects?: EnemyIntentEffects
  },
): readonly [GameState['rng'], EnemyIntent] {
  const [rngAfterDamage, dmg] = rollDice(rng, move.damage)
  const [nextRng, effects] = rollIntentEffects(rngAfterDamage, move.effects)
  return [nextRng, { kind: 'ATTACK', intentKind: move.intentKind, intentName: move.intentName, damage: dmg, effects }]
}

function intentPoolForTemplate(tmpl: EnemyTemplate): ReadonlyArray<EnemyIntentEntry> {
  return tmpl.intents.filter((entry) => (entry.choiceWeight ?? 1) > 0)
}

function eligibleIntentPool(
  pool: ReadonlyArray<EnemyIntentEntry>,
  lastChosenIntentId: EnemyIntentId | null,
  usedNeverRepeatIntentIds: ReadonlyArray<EnemyIntentId>,
): ReadonlyArray<EnemyIntentEntry> {
  const usedNeverRepeat = new Set(usedNeverRepeatIntentIds)
  const withoutUsedNeverRepeat = pool.filter((entry) => {
    if (entry.neverRepeat === true && usedNeverRepeat.has(entry.intentId)) return false
    return true
  })
  const filtered = withoutUsedNeverRepeat.filter((entry) => {
    if (entry.repeatable !== true && lastChosenIntentId === entry.intentId) return false
    return true
  })
  return filtered.length ? filtered : withoutUsedNeverRepeat
}

function alwaysFirstIntentEntry(pool: ReadonlyArray<EnemyIntentEntry>): EnemyIntentEntry | null {
  return pool.find((entry) => entry.alwaysFirst === true) ?? null
}

function pickIntentEntry(
  rng: GameState['rng'],
  pool: ReadonlyArray<EnemyIntentEntry>,
): readonly [GameState['rng'], EnemyIntentEntry] {
  const total = pool.reduce((acc, entry) => acc + (entry.choiceWeight ?? 1), 0)
  const [nextRng, n] = rngInt(rng, 0, Math.max(1, total))
  let cursor = 0
  for (const entry of pool) {
    cursor += entry.choiceWeight ?? 1
    if (n < cursor) return [nextRng, entry]
  }
  return [nextRng, pool[0]!]
}

function withDisplayIntentName(intent: EnemyIntent, intentName: string): EnemyIntent {
  if (intent.kind === 'WAIT') return intent
  return { ...intent, intentName }
}

function resolvedMoveToIntent(
  rng: GameState['rng'],
  move: ResolvedEnemyIntentMove,
): readonly [GameState['rng'], EnemyIntent] {
  if (move.kind === 'ATTACK') return rollMoveIntent(rng, move)
  return [rng, { kind: move.kind, intentKind: move.intentKind, intentName: move.intentName, effects: move.effects }]
}

export function rollEnemyIntent(state: GameState): GameState {
  if (!state.combat) return state
  let rng = state.rng
  const enemyById = { ...state.combat.enemies.enemyById }
  for (const id of state.combat.enemies.aliveIds) {
    const inst = enemyById[id]
    if (!inst || inst.hp <= 0) continue
    const tmpl = Enemies[inst.templateId]
    const pool = intentPoolForTemplate(tmpl)
    if (!pool.length) {
      enemyById[id] = { ...inst, intent: { kind: 'WAIT', intentKind: ENEMY_INTENT_KINDS.special } }
      continue
    }

    const eligible = eligibleIntentPool(pool, inst.lastChosenIntentId, inst.usedNeverRepeatIntentIds)
    const forcedFirst = inst.lastChosenIntentId === null ? alwaysFirstIntentEntry(pool) : null
    let entry: EnemyIntentEntry
    if (forcedFirst) {
      entry = forcedFirst
    } else if (!eligible.length) {
      enemyById[id] = { ...inst, intent: { kind: 'WAIT', intentKind: ENEMY_INTENT_KINDS.special } }
      continue
    } else {
      const [rngAfterPick, picked] = pickIntentEntry(rng, eligible)
      rng = rngAfterPick
      entry = picked
    }
    const move = resolveEnemyIntentDefForLevel(EnemyIntents[entry.intentId], tmpl.level)
    const [nextRng, intentBase] = resolvedMoveToIntent(rng, move)
    rng = nextRng
    const intent = entry.renameDisplayIntent
      ? withDisplayIntentName(intentBase, entry.renameDisplayIntent)
      : intentBase
    const usedNeverRepeatIntentIds =
      entry.neverRepeat === true && !inst.usedNeverRepeatIntentIds.includes(entry.intentId)
        ? [...inst.usedNeverRepeatIntentIds, entry.intentId]
        : inst.usedNeverRepeatIntentIds
    enemyById[id] = { ...inst, intent, lastChosenIntentId: entry.intentId, usedNeverRepeatIntentIds }
  }
  return { ...state, rng, combat: { ...state.combat, enemies: { ...state.combat.enemies, enemyById } } }
}
