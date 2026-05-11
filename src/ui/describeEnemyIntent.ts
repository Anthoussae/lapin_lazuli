import type { EnemyIntent } from '../core/types/state'
import { Cards } from '../data/cards'
import {
  burdenShuffleEntriesFromIntentEffects,
  enemyIntentMoveKinds,
  enemyLockedShieldGainFromIntentEffects,
  intentHasVampiric,
  playerTurnStartBunnyDrainFromIntentEffects,
  strengthDeltaFromIntentEffects,
} from '../systems/combat/intentEffects'

export function describeEnemyIntent(intent: EnemyIntent, strength: number): string {
  if (intent.kind === 'WAIT') return 'Wait'

  const segments: string[] = []
  if (intent.kind === 'ATTACK') {
    segments.push(`${intent.intentName} (${intent.damage + Math.max(0, strength)})`)
  } else {
    segments.push(intent.intentName)
  }

  const lockedShieldGain = enemyLockedShieldGainFromIntentEffects(intent.effects)
  if (lockedShieldGain > 0) segments.push(`gain ${lockedShieldGain} locked shield`)

  const strengthGain = strengthDeltaFromIntentEffects(intent.effects)
  if (strengthGain > 0) segments.push(`+${strengthGain} strength`)

  const bunnyDrain = playerTurnStartBunnyDrainFromIntentEffects(intent.effects)
  if (bunnyDrain > 0) segments.push(`drain ${bunnyDrain} bunnies each turn`)

  if (intentHasVampiric(intent.effects)) segments.push('restore HP equal to unshielded damage dealt')

  for (const { cardId, count } of burdenShuffleEntriesFromIntentEffects(intent.effects)) {
    const name = Cards[cardId]?.name ?? cardId
    segments.push(`shuffle ${count > 1 ? `${count} ` : ''}${name} into your deck`)
  }

  const moveKinds = enemyIntentMoveKinds(intent)
  if (moveKinds.length) segments.push(moveKinds.join(' · '))

  return segments.join(' · ')
}
