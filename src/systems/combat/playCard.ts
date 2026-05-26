import type { GameState } from '../../core/types/state'
import type { CardInstanceId, EnemyInstanceId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'
import type { Effect } from '../../data/effects'
import { Cards } from '../../data/cards'
import {
  cardInstanceConsumes,
  cardInstanceExhausts,
  cardInstanceResolvedPlayEffects,
  cardInstanceUpgradesAfterCasting,
} from '../cards/cardEffects'
import { isCardUpgradeable, upgradeCardInstance } from '../cards/upgrades'
import { applyEffects } from './resolveEffects'
import { setPhase } from '../../reducers/reduceGame'
import { Relics } from '../../data/relics'
import { applyRelicEffect } from '../relics/applyRelicEffects'
import { consumeCardFromDeck } from './zones'
import { cardHasFireTag, cardInstanceInkCost } from '../cards/inkCost'
import { consumeFreeFirstFireSpellIfFireCard } from '../relics/phoenixFeatherQuill'

export function playCard(state: GameState, cardInstanceId: CardInstanceId): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }
  const inst = state.player.deck.cardById[cardInstanceId]
  if (!inst) return { state, events: [] }
  if (!state.player.deck.hand.includes(cardInstanceId)) return { state, events: [] }
  if (inst.exhausted) return { state, events: [] }
  const tmpl = Cards[inst.templateId]
  const inkOpts = { freeFirstFireSpell: state.combat.freeFirstFireSpell }
  const cost = cardInstanceInkCost(inst, tmpl, inkOpts)
  if (cost === null || state.player.energy < cost) return { state, events: [] }
  const selectedEnemyId: EnemyInstanceId | null = state.combat.targeting.selectedEnemyId

  const scaled = cardInstanceResolvedPlayEffects(inst)
  const handSelectionEffect = scaled.find(
    (fx): fx is Extract<Effect, { kind: 'UPGRADE_SELECTED_CARD' | 'CONSUME_SELECTED_CARD' }> =>
      fx.kind === 'UPGRADE_SELECTED_CARD' || fx.kind === 'CONSUME_SELECTED_CARD',
  )

  // Selection cards are not actually "cast" until the player completes selections.
  // Cancelling means: no ink spent, card stays in hand, no on-cast triggers fired.
  if (
    handSelectionEffect &&
    handSelectionEffect.numberOfTargets > 0 &&
    (handSelectionEffect.kind === 'CONSUME_SELECTED_CARD' || handSelectionEffect.upgradeAmount > 0)
  ) {
    const eligibleIds: CardInstanceId[] = []
    const seenEligible = new Set<CardInstanceId>()
    for (const id of state.player.deck.hand) {
      if (id === cardInstanceId) continue
      if (seenEligible.has(id)) continue
      const candidate = state.player.deck.cardById[id]
      if (!candidate) continue
      if (handSelectionEffect.kind === 'UPGRADE_SELECTED_CARD' && !isCardUpgradeable(candidate.templateId)) continue
      seenEligible.add(id)
      eligibleIds.push(id)
    }
    const maxPicks = Math.min(handSelectionEffect.numberOfTargets, eligibleIds.length)
    if (maxPicks <= 0) return { state, events: [] }

    const combat0 = state.combat
    if (!combat0) return { state, events: [] }

    const sPick: GameState = {
      ...state,
      combat: {
        ...combat0,
        handSelection: {
          kind: handSelectionEffect.kind,
          playedCardInstanceId: cardInstanceId,
          cost,
          numberOfTargets: handSelectionEffect.numberOfTargets,
          upgradeAmount: handSelectionEffect.kind === 'UPGRADE_SELECTED_CARD' ? handSelectionEffect.upgradeAmount : 0,
          eligibleIds,
          chosenIds: [],
        },
      },
    }
    return { state: setPhase(sPick, 'COMBAT_SELECT_HAND_CARD'), events: [] }
  }

  const s0: GameState = setPhase(state, 'COMBAT_RESOLVING')

  // Relic triggers for "card played" (if any).
  let s0b: GameState = s0
  for (const rInst of s0b.player.relics) {
    const rTmpl = Relics[rInst.templateId]
    for (const trig of rTmpl.triggers) {
      if (trig.on !== 'card_played') continue
      s0b = applyRelicEffect(s0b, trig.effect)
    }
  }

  let s1: GameState = {
    ...s0b,
    player: { ...s0b.player, energy: s0b.player.energy - cost },
  }
  if (cardHasFireTag(tmpl.tags)) {
    s1 = consumeFreeFirstFireSpellIfFireCard(s1, tmpl)
  }

  let events: GameEvent[] = [{ type: 'EVT/CARD_PLAYED', cardInstanceId }]
  if (cost > 0) events.push({ type: 'EVT/ENERGY_SPENT', amount: cost })

  // Rule: cards resolve first, then go to discard.
  const outFx = applyEffects(s1, scaled, { selectedEnemyId, playedCardInstanceId: cardInstanceId }, {
    powerBoostsCardAddBunnies: true,
    shieldPowerBoostsCardGainShield: true,
    firepowerBoostsCardDealDamage: true,
  })
  events = events.concat(outFx.events)

  let sAfterFx = outFx.state
  if (cardInstanceUpgradesAfterCasting(inst)) {
    sAfterFx = upgradeCardInstance(sAfterFx, cardInstanceId, 1)
  }

  const consumes = cardInstanceConsumes(inst)
  const sAfterDiscard: GameState = consumes
    ? consumeCardFromDeck(sAfterFx, cardInstanceId)
    : (() => {
        // Exhausted cards still discard normally; the exhausted flag prevents recasting this combat.
        const hand2 = sAfterFx.player.deck.hand.filter((id) => id !== cardInstanceId)
        const instAfterFx = sAfterFx.player.deck.cardById[cardInstanceId] ?? inst
        const exhausts = cardInstanceExhausts(instAfterFx)
        const maybeExhaustedInst = exhausts ? { ...instAfterFx, exhausted: true } : instAfterFx
        const cardById2 = exhausts
          ? { ...sAfterFx.player.deck.cardById, [cardInstanceId]: maybeExhaustedInst }
          : sAfterFx.player.deck.cardById
        return {
          ...sAfterFx,
          player: {
            ...sAfterFx.player,
            deck: {
              ...sAfterFx.player.deck,
              cardById: cardById2,
              hand: hand2,
              discardPile: [...sAfterFx.player.deck.discardPile, cardInstanceId],
            },
          },
        }
      })()

  const s4 = setPhase(sAfterDiscard, 'COMBAT_PLAYER_READY')

  return { state: s4, events }
}

