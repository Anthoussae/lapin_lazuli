import type { EnemyIntent } from '../core/types/state'
import { Cards } from '../data/cards'
import { Enchantments } from '../data/enchantments'
import {
  applyEnchantmentGrantsFromIntentEffects,
  burdenShuffleEntriesFromIntentEffects,
  enemyAttackStrengthDamageBonus,
  enemyIntentKind,
  enemyLockedShieldGainFromIntentEffects,
  enemyShieldGainFromIntentEffects,
  intentHasVampiric,
  playerTurnStartBunnyDrainFromIntentEffects,
  strengthDeltaFromIntentEffects,
} from '../systems/combat/intentEffects'

export function describeEnemyIntent(
  intent: EnemyIntent,
  strength: number,
  /** Resolved attack damage (modifiers on enemy/player); falls back to base + strength. */
  attackDamageDisplay?: number,
): string {
  if (intent.kind === 'WAIT') return 'Wait'

  const segments: string[] = []
  if (intent.kind === 'ATTACK') {
    const strBonus = enemyAttackStrengthDamageBonus(strength)
    const dmg = attackDamageDisplay ?? intent.damage + strBonus
    segments.push(`${intent.intentName} (${dmg})`)
  } else {
    segments.push(intent.intentName)
  }

  const lockedShieldGain = enemyLockedShieldGainFromIntentEffects(intent.effects)
  if (lockedShieldGain > 0) segments.push(`gain ${lockedShieldGain} locked shield`)

  const shieldGain = enemyShieldGainFromIntentEffects(intent.effects)
  if (shieldGain > 0) segments.push(`gain ${shieldGain} shield`)

  const strengthGain = strengthDeltaFromIntentEffects(intent.effects)
  if (strengthGain > 0) segments.push(`+${strengthGain} strength`)

  const bunnyDrain = playerTurnStartBunnyDrainFromIntentEffects(intent.effects)
  if (bunnyDrain > 0) segments.push(`drain ${bunnyDrain} bunnies each turn`)

  if (intentHasVampiric(intent.effects)) segments.push('restore HP equal to unshielded damage dealt')

  for (const { cardId, count } of burdenShuffleEntriesFromIntentEffects(intent.effects)) {
    const name = Cards[cardId]?.name ?? cardId
    segments.push(`shuffle ${count > 1 ? `${count} ` : ''}${name} into your deck`)
  }

  for (const grant of applyEnchantmentGrantsFromIntentEffects(intent.effects)) {
    const tmpl = Enchantments[grant.enchantmentId]
    const name = tmpl?.name ?? grant.enchantmentId
    let perStack = grant.amountOverride
    if (perStack == null && tmpl?.ability.kind === 'TRIGGERED') {
      const hpLoss = tmpl.ability.effects.find((fx) => fx.kind === 'HP_LOSS')
      if (hpLoss) perStack = hpLoss.amount
    }
    const amt = perStack ?? 0
    if (grant.stacks > 1) {
      segments.push(`apply ${grant.stacks} ${name} (${amt} HP loss each turn per stack)`)
    } else {
      segments.push(`apply ${name} (${amt} HP loss each turn)`)
    }
  }

  segments.push(enemyIntentKind(intent))

  return segments.join(' · ')
}
