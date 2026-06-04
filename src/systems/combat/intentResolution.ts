import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnemyIntent, EnemyIntentEffects, GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import {
  applyPlayerDodgeRelicTriggers,
  applyPlayerUnblockedDamageRelicTriggers,
  applyTotalAttackBlockRelicTriggers,
} from '../relics/triggers'
import { playerDodgeChanceFromRelics, rollDodge } from './dodge'
import { applyPlayerDamageThroughShieldsMaybeBubble } from '../enchantments/bubble'
import { applyIncomingDamageAmplification } from '../enchantments/incomingDamageAmplification'
import { applyOutgoingDamageAndHpLossModifiers } from '../enchantments/outgoingDamageReduction'
import { applyEnchantmentOnTakingDamage } from '../enchantments/takingDamage'
import { enqueueBurdenAdds } from './burdenAdd'
import {
  applyEnchantmentGrantsFromIntentEffects,
  burdenShuffleEntriesFromIntentEffects,
  enemyAttackStrengthDamageBonus,
  enemyLockedShieldGainFromIntentEffects,
  enemyShieldGainFromIntentEffects,
  intentHasVampiric,
  playerTurnStartBunnyDrainFromIntentEffects,
  strengthDeltaFromIntentEffects,
} from './intentEffects'
import { grantEnchantmentStacks } from '../enchantments/grantEnchantmentStacks'
import { shieldPowerPenaltyFromEnchantments } from '../enchantments/staticEffects'
import { resolveShieldGainAmount } from '../cards/shieldPower'

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
  const enemyTarget = { kind: 'ENEMY' as const, enemyInstanceId: enemyId }
  const shieldPenalty = shieldPowerPenaltyFromEnchantments(state, enemyTarget)
  const lockedShieldGain = resolveShieldGainAmount(
    enemyLockedShieldGainFromIntentEffects(effects),
    0,
    shieldPenalty,
    false,
  )
  const shieldGain = resolveShieldGainAmount(
    enemyShieldGainFromIntentEffects(effects),
    0,
    shieldPenalty,
    false,
  )
  if (strengthGain <= 0 && lockedShieldGain <= 0 && shieldGain <= 0) return state

  const enemyById = {
    ...combat.enemies.enemyById,
    [enemyId]: {
      ...enemy,
      strength: enemy.strength + strengthGain,
      shield: enemy.shield + shieldGain,
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
  if (sourceEnemyId) {
    for (const grant of applyEnchantmentGrantsFromIntentEffects(effects)) {
      s = grantEnchantmentStacks(s, {
        templateId: grant.enchantmentId,
        target: { kind: 'PLAYER' },
        owner: { kind: 'ENEMY', enemyInstanceId: sourceEnemyId },
        stacks: grant.stacks,
        amountOverride: grant.amountOverride,
      })
    }
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

  const strBonus = enemyAttackStrengthDamageBonus(enemy.strength)
  const dmg = intent.damage + strBonus

  let s: GameState = state
  const events: GameEvent[] = []

  const dodgeRoll = rollDodge(s, playerDodgeChanceFromRelics(s))
  s = dodgeRoll.state
  const dodged = dmg > 0 && dodgeRoll.dodged

  let nextSh = s.player.shield
  let nextLockedSh = s.player.lockedShield
  let nextHp = s.player.hp
  let unshieldedDamage = 0

  if (dodged) {
    const dodgeFx = applyPlayerDodgeRelicTriggers(s)
    s = dodgeFx.state
    events.push({ type: 'EVT/PLAYER_DODGED' }, ...dodgeFx.events)
  } else if (dmg > 0) {
    const resolvedDmg = applyIncomingDamageAmplification(
      s,
      { kind: 'PLAYER' },
      applyOutgoingDamageAndHpLossModifiers(s, { kind: 'ENEMY', enemyInstanceId: enemyId }, dmg),
    )
    const damageHit = applyPlayerDamageThroughShieldsMaybeBubble(
      s,
      { kind: 'PLAYER' },
      s.player.shield,
      s.player.lockedShield,
      s.player.hp,
      resolvedDmg,
    )
    s = damageHit.state
    nextSh = damageHit.shield
    nextLockedSh = damageHit.lockedShield
    nextHp = damageHit.hp
    unshieldedDamage = damageHit.unshieldedDamage

    if (unshieldedDamage > 0) {
      events.push({ type: 'EVT/PLAYER_UNBLOCKED_DAMAGE', source: 'ENEMY', amount: unshieldedDamage })
      const triggered = applyPlayerUnblockedDamageRelicTriggers(s, unshieldedDamage)
      s = triggered.state
      events.push(...triggered.events)
    } else {
      const blocked = applyTotalAttackBlockRelicTriggers(s, dmg, unshieldedDamage)
      s = blocked.state
      events.push(...blocked.events)
    }

    s = {
      ...s,
      player: { ...s.player, shield: nextSh, lockedShield: nextLockedSh, hp: nextHp },
    }

    const ench = applyEnchantmentOnTakingDamage(s, {
      target: { kind: 'PLAYER' },
      source: { kind: 'ENEMY', enemyInstanceId: enemyId },
      attemptedDamage: resolvedDmg,
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
