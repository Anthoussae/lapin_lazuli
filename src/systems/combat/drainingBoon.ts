import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { Enemies } from '../../data/enemies'
import { EnemyBoons, enemyBoonEffectInstances } from '../../data/enemyBoons'

/** Bunnies lost at the start of each player turn from Draining (sum over alive enemies). */
export function combatPlayerTurnStartBunnyDrainFromAlive(state: GameState): number {
  const c = state.combat
  if (!c) return 0
  let total = 0
  for (const id of c.enemies.aliveIds) {
    const e = c.enemies.enemyById[id]
    if (!e || e.hp <= 0) continue
    const level = Enemies[e.templateId]?.level ?? 0
    for (const b of e.boons) {
      const per = EnemyBoons[b]?.playerTurnStartBunnyDrain ?? 0
      if (per) total += per * enemyBoonEffectInstances(b, level)
    }
  }
  return total
}

export function applyDrainingAtPlayerTurnStart(state: GameState): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }

  const events: GameEvent[] = []
  for (const id of state.combat.enemies.aliveIds) {
    const e = state.combat.enemies.enemyById[id]
    if (!e || e.hp <= 0) continue
    for (const boonId of e.boons) {
      const tmpl = EnemyBoons[boonId]
      if (!tmpl) continue
      for (const trig of tmpl.triggers ?? []) {
        if (trig.on !== 'player_turn_start') continue
        events.push({ type: 'EVT/BOON_TRIGGERED', enemyId: id, boonId, trigger: trig.id })
      }
    }
  }

  const drain = combatPlayerTurnStartBunnyDrainFromAlive(state) + state.combat.playerTurnStartBunnyDrain
  if (drain <= 0) return { state, events }

  return {
    state: { ...state, player: { ...state.player, bunnies: state.player.bunnies - drain } },
    events,
  }
}
