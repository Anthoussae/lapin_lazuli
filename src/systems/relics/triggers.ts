import type { GameState } from '../../core/types/state'
import type { RelicId } from '../../core/types/ids'
import { Relics } from '../../data/relics'
import { applyRelicEffect } from './applyRelicEffects'

export type RelicTriggerKind =
  | 'onPickup'
  | 'draw_starting_hand'
  | 'combat_start'
  | 'turn_start'
  | 'card_played'
  | 'turn_end'
  | 'enemy_attack'
  | 'enemy_defeated'
  | 'onRest'

export function applyRelicTriggers(state: GameState, relicId: RelicId, on: RelicTriggerKind): GameState {
  const tmpl = Relics[relicId]
  let s = state
  for (const trig of tmpl.triggers) {
    if (trig.on !== on) continue
    s = applyRelicEffect(s, trig.effect)
  }
  return s
}

export function applyTurnStartRelicTriggers(state: GameState): GameState {
  let s = state
  for (const rInst of s.player.relics) {
    s = applyRelicTriggers(s, rInst.templateId, 'turn_start')
  }
  return s
}

