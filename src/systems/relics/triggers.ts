import type { GameState } from '../../core/types/state'
import type { RelicId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'
import { Relics } from '../../data/relics'
import { applyRelicEffect } from './applyRelicEffects'

export type RelicTriggerKind =
  | 'onPickup'
  | 'draw_starting_hand'
  | 'onNonOpenerCardDraw'
  | 'combat_start'
  | 'turn_start'
  | 'card_played'
  | 'turn_end'
  | 'enemy_attack'
  | 'enemy_defeated'
  | 'onRest'
  | 'onSleep'

export function applyRelicTriggers(state: GameState, relicId: RelicId, on: RelicTriggerKind): GameState {
  const tmpl = Relics[relicId]
  let s = state
  for (const trig of tmpl.triggers) {
    if (trig.on !== on) continue
    s = applyRelicEffect(s, trig.effect)
  }
  return s
}

export function applyNonOpenerCardDrawRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onNonOpenerCardDraw') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

export function applyTurnStartRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'turn_start') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}
