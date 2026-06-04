import type { CardInstance, GameState } from '../../core/types/state'
import type { PathId, RelicId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'
import { Cards } from '../../data/cards'
import { Relics } from '../../data/relics'
import { isCombatPath } from '../paths/rollPathCombat'
import { applyRelicEffect, type RelicEffectContext } from './applyRelicEffects'

const BACKPACK_COUNTER_KEY = 'backpackTurnCounter' as const

export type RelicTriggerKind =
  | 'onPickup'
  | 'draw_starting_hand'
  | 'onNonOpenerCardDraw'
  | 'combat_start'
  | 'turn_start'
  | 'fourthSpellCastPerTurn'
  | 'castSpellWithCostAboveAmount'
  | 'onCastNamedCard'
  | 'card_played'
  | 'potion_played'
  | 'turn_end'
  | 'enemy_attack'
  | 'onReceivingAttack'
  | 'onPlayerUnblockedDamage'
  | 'onTotalAttackBlock'
  | 'enemy_defeated'
  | 'miniboss_defeated'
  | 'combat_end'
  | 'onRest'
  | 'onSleep'
  | 'onLevelUp'
  | 'onAddCardToDeck'
  | 'onAddCardOfType'
  | 'onChoosingPath'

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

/** Intentional map combat-door selection (excludes combat entered via mystery rooms). */
export function applyChoosingPathRelicTriggers(
  state: GameState,
  pathId: PathId,
): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onChoosingPath') continue
      if (trig.choosingPathType === 'combat' && !isCombatPath(pathId)) continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

export function applyAddCardToDeckRelicTriggers(
  state: GameState,
  addedCard: CardInstance,
): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  const cardTemplate = Cards[addedCard.templateId]
  const addCardCtx: RelicEffectContext = { addedCardInstanceId: addedCard.id }

  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on === 'onAddCardToDeck') {
        s = applyRelicEffect(s, trig.effect)
        events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
        continue
      }
      if (trig.on !== 'onAddCardOfType') continue
      const tag = trig.cardTag
      if (!tag || !cardTemplate?.tags.includes(tag)) continue
      s = applyRelicEffect(s, trig.effect, addCardCtx)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

export function applyLevelUpRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onLevelUp') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

export function applyCombatEndRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'combat_end') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

export function applyMinibossDefeatedRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'miniboss_defeated') continue
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
    if (rInst.templateId === 'BACKPACK') {
      const backpackTmpl = Relics[rInst.templateId]
      const every = backpackTmpl.counterEveryTurns ?? 3
      const nextCount = (rInst.counters[BACKPACK_COUNTER_KEY] ?? 0) + 1
      const fire = every > 0 && nextCount >= every
      const deckSize = Object.keys(s.player.deck.cardById).length
      const appliedCount = fire ? 0 : nextCount

      const nextRelics = s.player.relics.map((ri) =>
        ri.id === rInst.id
          ? { ...ri, counters: { ...ri.counters, [BACKPACK_COUNTER_KEY]: appliedCount } }
          : ri,
      )
      s = { ...s, player: { ...s.player, relics: nextRelics } }

      events.push({
        type: 'EVT/RELIC_TRIGGERED',
        relicId: rInst.templateId,
        trigger: 'BACKPACK_TURN_TICK',
      })

      if (fire && deckSize > 0) {
        s = { ...s, player: { ...s.player, shield: s.player.shield + deckSize } }
        events.push({
          type: 'EVT/RELIC_TRIGGERED',
          relicId: rInst.templateId,
          trigger: 'BACKPACK_SHIELD',
        })
      }
    }

    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'turn_start') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

/**
 * Paintbrush: the fifth spell cast each turn costs 0 ink.
 * Triggered by the 4th successful spell cast in a player turn; gated to fire once per turn.
 */
/** Fires when the player successfully plays a card (including after hand-selection modals). */
export function applyCardPlayedRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'card_played') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

/** Fires when the player casts a card with the potion template flag. */
export function applyPotionPlayedRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'potion_played') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

/** Fires when the player casts a spell whose printed ink cost is at least the trigger threshold. */
export function applyCastSpellWithCostAboveAmountRelicTriggers(
  state: GameState,
  spellInkCost: number | null,
): { state: GameState; events: GameEvent[] } {
  if (spellInkCost === null) return { state, events: [] }

  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'castSpellWithCostAboveAmount') continue
      const threshold = trig.amount ?? 0
      if (spellInkCost < threshold) continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

export function applyFourthSpellCastPerTurnRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat) return { state, events: [] }
  if (combat.paintbrushTriggeredThisTurn) return { state, events: [] }
  if (combat.cardsPlayedThisTurn !== 4) return { state, events: [] }

  let s = state
  const events: GameEvent[] = []
  let fired = false
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'fourthSpellCastPerTurn') continue
      fired = true
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }

  const combatAfter = s.combat ?? combat
  if (!fired || !combatAfter) return { state: s, events }
  return {
    state: {
      ...s,
      combat: { ...combatAfter, paintbrushTriggeredThisTurn: true },
    },
    events,
  }
}

/** Enemy attack dealt damage but player lost 0 HP (fully blocked by shields, etc.). */
export function applyTotalAttackBlockRelicTriggers(
  state: GameState,
  attackDamage: number,
  unblockedDamage: number,
): { state: GameState; events: GameEvent[] } {
  if (attackDamage <= 0 || unblockedDamage > 0) return { state, events: [] }

  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onTotalAttackBlock') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

/** Fires when the player successfully dodges an enemy attack (for trigger FX). */
export function applyPlayerDodgeRelicTriggers(state: GameState): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onReceivingAttack') continue
      if (trig.effect.kind !== 'DODGE') continue
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }
  return { state: s, events }
}

/** First unblocked HP damage each combat — fires once per fight when {@link unblockedDamage} > 0. */
export function applyPlayerUnblockedDamageRelicTriggers(
  state: GameState,
  unblockedDamage: number,
): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (unblockedDamage <= 0 || !combat || combat.playerTookUnblockedDamage) {
    return { state, events: [] }
  }

  let s = state
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onPlayerUnblockedDamage') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }

  const combatAfterEffects = s.combat ?? combat
  return {
    state: {
      ...s,
      combat: { ...combatAfterEffects, playerTookUnblockedDamage: true },
    },
    events,
  }
}
