import type { CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'

/** Boon trigger events after opening hand is drawn (enemy source + disabled cards in hand). */
export function disablingBoonTriggerEvents(state: GameState): GameEvent[] {
  const combat = state.combat
  if (!combat) return []

  const disabledInHand = state.player.deck.hand.filter((id) => state.player.deck.cardById[id]?.disabled === true)
  const events: GameEvent[] = []

  for (const enemyId of combat.enemies.aliveIds) {
    const e = combat.enemies.enemyById[enemyId]
    if (!e?.boons.includes('DISABLING')) continue
    events.push({
      type: 'EVT/BOON_TRIGGERED',
      enemyId,
      boonId: 'DISABLING',
      trigger: 'DISABLING_COMBAT_START',
      ...(disabledInHand.length ? { targetCardInstanceIds: disabledInHand as CardInstanceId[] } : {}),
    })
  }

  return events
}
