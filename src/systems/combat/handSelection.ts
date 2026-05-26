import type { GameState } from '../../core/types/state'
import type { CardInstanceId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'
import { setPhase } from '../../reducers/reduceGame'
import {
  cardInstanceConsumes,
  cardInstanceExhausts,
  cardInstanceResolvedPlayEffects,
  cardInstanceUpgradesAfterCasting,
} from '../cards/cardEffects'
import { upgradeCardInstance } from '../cards/upgrades'
import { Cards } from '../../data/cards'
import { Relics } from '../../data/relics'
import { applyRelicEffect } from '../relics/applyRelicEffects'
import { applyEffects } from './resolveEffects'
import { consumeCardFromDeck } from './zones'
import { cardHasFireTag, cardInstanceInkCost } from '../cards/inkCost'
import { consumeFreeFirstFireSpellIfFireCard } from '../relics/phoenixFeatherQuill'

export function cancelHandSelection(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat?.handSelection) return { state, events: [] }

  return {
    state: setPhase(
      {
        ...state,
        combat: { ...combat, handSelection: null },
      },
      'COMBAT_PLAYER_READY',
    ),
    events: [],
  }
}

export function pickHandSelectionCard(state: GameState, cardInstanceId: CardInstanceId): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  const pick = combat?.handSelection
  if (!combat || !pick) return { state, events: [] }

  if (!pick.eligibleIds.includes(cardInstanceId)) return { state, events: [] }

  if (pick.chosenIds.includes(cardInstanceId)) {
    const nextChosen = pick.chosenIds.filter((id) => id !== cardInstanceId)
    return {
      state: {
        ...state,
        combat: { ...combat, handSelection: { ...pick, chosenIds: nextChosen } },
      },
      events: [],
    }
  }

  const maxPicks = Math.min(pick.numberOfTargets, pick.eligibleIds.length)
  if (pick.chosenIds.length >= maxPicks) return { state, events: [] }

  const nextChosen = [...pick.chosenIds, cardInstanceId]

  return {
    state: {
      ...state,
      combat: { ...combat, handSelection: { ...pick, chosenIds: nextChosen } },
    },
    events: [],
  }
}

export function submitHandSelection(state: GameState): { state: GameState; events: GameEvent[] } {
  const pick = state.combat?.handSelection
  if (!pick || pick.chosenIds.length <= 0) return { state, events: [] }
  return resolveHandSelection(state, pick.chosenIds)
}

function resolveHandSelection(state: GameState, chosenIds: ReadonlyArray<CardInstanceId>): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  const pick = combat?.handSelection
  if (!combat || !pick) return { state, events: [] }

  // Selection committed: NOW the selection card is actually cast.
  const playedId = pick.playedCardInstanceId
  const inst = state.player.deck.cardById[playedId]
  if (!inst) {
    return { state: setPhase({ ...state, combat: { ...combat, handSelection: null } }, 'COMBAT_PLAYER_READY'), events: [] }
  }
  if (!state.player.deck.hand.includes(playedId)) {
    return { state: setPhase({ ...state, combat: { ...combat, handSelection: null } }, 'COMBAT_PLAYER_READY'), events: [] }
  }
  if (inst.exhausted) {
    return { state: setPhase({ ...state, combat: { ...combat, handSelection: null } }, 'COMBAT_PLAYER_READY'), events: [] }
  }
  const tmpl = Cards[inst.templateId]
  const inkOpts = { freeFirstFireSpell: state.combat.freeFirstFireSpell }
  const cost = cardInstanceInkCost(inst, tmpl, inkOpts)
  if (cost === null || state.player.energy < cost) {
    // Energy changed while modal open; treat as cancel but keep pick closed.
    return { state: setPhase({ ...state, combat: { ...combat, handSelection: null } }, 'COMBAT_PLAYER_READY'), events: [] }
  }

  // Phase resolving + on-cast relic triggers.
  let s: GameState = setPhase({ ...state, combat: { ...combat, handSelection: null } }, 'COMBAT_RESOLVING')
  for (const rInst of s.player.relics) {
    const rTmpl = Relics[rInst.templateId]
    for (const trig of rTmpl.triggers) {
      if (trig.on !== 'card_played') continue
      s = applyRelicEffect(s, trig.effect)
    }
  }

  // Pay cost.
  s = { ...s, player: { ...s.player, energy: s.player.energy - cost } }
  if (cardHasFireTag(tmpl.tags)) {
    s = consumeFreeFirstFireSpellIfFireCard(s, tmpl)
  }

  if (cardInstanceConsumes(inst)) {
    s = consumeCardFromDeck(s, playedId)
  } else {
    // Exhausted cards still discard normally; the exhausted flag prevents recasting this combat.
    const hand2 = s.player.deck.hand.filter((id) => id !== playedId)
    const exhausts = cardInstanceExhausts(inst)
    const inst2 = exhausts ? { ...inst, exhausted: true } : inst
    const cardById2 = exhausts ? { ...s.player.deck.cardById, [playedId]: inst2 } : s.player.deck.cardById
    s = {
      ...s,
      player: { ...s.player, deck: { ...s.player.deck, cardById: cardById2, hand: hand2, discardPile: [...s.player.deck.discardPile, playedId] } },
    }
  }

  for (const id of chosenIds) {
    s = pick.kind === 'CONSUME_SELECTED_CARD' ? consumeCardFromDeck(s, id) : upgradeCardInstance(s, id, pick.upgradeAmount)
  }

  // Apply any non-interactive effects the card might also have (if we add such cards later).
  const scaled = cardInstanceResolvedPlayEffects(inst)
  const nonInteractiveFx = scaled.filter((fx) => fx.kind !== 'UPGRADE_SELECTED_CARD' && fx.kind !== 'CONSUME_SELECTED_CARD')
  const selectedEnemyId = s.combat?.targeting.selectedEnemyId ?? null
  const out = applyEffects(s, nonInteractiveFx, { selectedEnemyId, playedCardInstanceId: playedId }, {
    powerBoostsCardAddBunnies: true,
    shieldPowerBoostsCardGainShield: true,
    firepowerBoostsCardDealDamage: true,
  })
  s = out.state
  if (cardInstanceUpgradesAfterCasting(inst)) {
    s = upgradeCardInstance(s, playedId, 1)
  }

  return { state: setPhase(s, 'COMBAT_PLAYER_READY'), events: [] }
}
