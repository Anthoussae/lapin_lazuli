import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnemyIntent, EnemyIntentEffects, GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { applyPlayerUnblockedDamageRelicTriggers, applyTotalAttackBlockRelicTriggers } from '../relics/triggers'
import { applyPlayerDamageThroughShields } from './shieldDamage'
import { applyEnchantmentOnTakingDamage } from '../enchantments/takingDamage'
import { enqueueBurdenAdds } from './burdenAdd'
import {
  burdenShuffleEntriesFromIntentEffects,
  enemyLockedShieldGainFromIntentEffects,
  intentHasVampiric,
  playerTurnStartBunnyDrainFromIntentEffects,
  strengthDeltaFromIntentEffects,
} from './intentEffects'

export type ResolveEnemyIntentResult = Readonly<{
  state: GameState
  playerDied: boolean
  events: GameEvent[]
}>

function applyEnemySelfBuffs(
  state: GameState,
  enemyId: EnemyInstanceId,
  effects: EnemyIntentEffects | undefined,
): GameState {
  const combat = state.combat
  if (!combat) return state
  const enemy = combat.enemies.enemyById[enemyId]
  if (!enemy) return state

  const strengthGain = strengthDeltaFromIntentEffects(effects)
  const lockedShieldGain = enemyLockedShieldGainFromIntentEffects(effects)
  if (strengthGain <= 0 && lockedShieldGain <= 0) return state

  const enemyById = {
    ...combat.enemies.enemyById,
    [enemyId]: {
      ...enemy,
      strength: enemy.strength + strengthGain,
      lockedShield: enemy.lockedShield + lockedShieldGain,
    },
  }
  return { ...state, combat: { ...combat, enemies: { ...combat.enemies, enemyById } } }
}

function applyPlayerDebuffs(
  state: GameState,
  effects: EnemyIntentEffects | undefined,
  sourceEnemyId: EnemyInstanceId | null,
): GameState {
  let s = state
  const bunnyDrainAdd = playerTurnStartBunnyDrainFromIntentEffects(effects)
  if (bunnyDrainAdd > 0 && s.combat) {
    s = {
      ...s,
      combat: {
        ...s.combat,
        playerTurnStartBunnyDrain: s.combat.playerTurnStartBunnyDrain + bunnyDrainAdd,
      },
    }
  }
  for (const { cardId, count } of burdenShuffleEntriesFromIntentEffects(effects)) {
    s = enqueueBurdenAdds(s, cardId, count, 'draw', sourceEnemyId)
  }
  return s
}

function resolveBuff(state: GameState, enemyId: EnemyInstanceId, intent: Extract<EnemyIntent, { kind: 'BUFF' }>): GameState {
  return applyEnemySelfBuffs(state, enemyId, intent.effects)
}

function resolveDebuff(
  state: GameState,
  enemyId: EnemyInstanceId,
  intent: Extract<EnemyIntent, { kind: 'DEBUFF' }>,
): GameState {
  return applyPlayerDebuffs(state, intent.effects, enemyId)
}

function resolveAttack(
  state: GameState,
  enemyId: EnemyInstanceId,
  intent: Extract<EnemyIntent, { kind: 'ATTACK' }>,
): ResolveEnemyIntentResult {
  const combat = state.combat
  if (!combat) return { state, playerDied: false, events: [] }
  const enemy = combat.enemies.enemyById[enemyId]
  if (!enemy) return { state, playerDied: false, events: [] }

  const str = Math.max(0, enemy.strength)
  const dmg = intent.damage + str
  const { shield: nextSh, lockedShield: nextLockedSh, hp: nextHp, unshieldedDamage } = applyPlayerDamageThroughShields(
    state.player.shield,
    state.player.lockedShield,
    state.player.hp,
    dmg,
  )

  let s: GameState = state
  const events: GameEvent[] = []

  if (unshieldedDamage > 0) {
    const triggered = applyPlayerUnblockedDamageRelicTriggers(s, unshieldedDamage)
    s = triggered.state
    events.push(...triggered.events)
  } else if (dmg > 0) {
    const blocked = applyTotalAttackBlockRelicTriggers(s, dmg, unshieldedDamage)
    s = blocked.state
    events.push(...blocked.events)
  }

  s = {
    ...s,
    player: { ...s.player, shield: nextSh, lockedShield: nextLockedSh, hp: nextHp },
  }

  if (dmg > 0) {
    const ench = applyEnchantmentOnTakingDamage(s, {
      target: { kind: 'PLAYER' },
      source: { kind: 'ENEMY', enemyInstanceId: enemyId },
      attemptedDamage: dmg,
      cause: 'DIRECT',
    })
    s = ench.state
    events.push(...ench.events)
  }
  if (intentHasVampiric(intent.effects) && unshieldedDamage > 0) {
    const combatAfterHit = s.combat
    const enemyAfterHit = combatAfterHit?.enemies.enemyById[enemyId]
    if (combatAfterHit && enemyAfterHit) {
      const enemyById = {
        ...combatAfterHit.enemies.enemyById,
        [enemyId]: {
          ...enemyAfterHit,
          hp: Math.min(enemyAfterHit.maxHp, enemyAfterHit.hp + unshieldedDamage),
        },
      }
      s = { ...s, combat: { ...combatAfterHit, enemies: { ...combatAfterHit.enemies, enemyById } } }
    }
  }
  s = applyEnemySelfBuffs(s, enemyId, intent.effects)
  s = applyPlayerDebuffs(s, intent.effects, enemyId)
  return { state: s, playerDied: nextHp <= 0, events }
}

export function resolveEnemyIntent(
  state: GameState,
  enemyId: EnemyInstanceId,
  intent: EnemyIntent,
): ResolveEnemyIntentResult {
  if (intent.kind === 'WAIT') return { state, playerDied: false, events: [] }
  if (intent.kind === 'BUFF') return { state: resolveBuff(state, enemyId, intent), playerDied: false, events: [] }
  if (intent.kind === 'DEBUFF') return { state: resolveDebuff(state, enemyId, intent), playerDied: false, events: [] }
  return resolveAttack(state, enemyId, intent)
}
