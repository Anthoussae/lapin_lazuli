import type { GameState } from '../../core/types/state'
import type { CardInstanceId, EnemyInstanceId } from '../../core/types/ids'
import type { GameEvent } from '../../reducers/events'
import type { Effect } from '../../data/effects'
import { Cards, isPotionCardId } from '../../data/cards'
import {
  cardInstanceConsumes,
  cardInstanceExhausts,
  cardInstanceResolvedPlayEffects,
  cardInstanceUpgradesAfterCasting,
  cardPlayPhasesOut,
} from '../cards/cardEffects'
import { isCardInstanceUpgradeable, upgradeCardInstance } from '../cards/upgrades'
import { applyEffects } from './resolveEffects'
import { setPhase } from '../../reducers/reduceGame'
import { consumeCardFromDeck } from './zones'
import { cardHasFireTag, cardInstanceInkCost, cardInstanceLooksExhausted } from '../cards/inkCost'
import { applyCriticalRollToCardEffects } from '../cards/critical'
import { cardPlayEffectsWithRelicCritical } from '../relics/onCastNamedCardCritical'
import { consumeFreeFirstFireSpellIfFireCard } from '../relics/phoenixFeatherQuill'
import {
  applyCardPlayedRelicTriggers,
  applyCastSpellWithCostAboveAmountRelicTriggers,
  applyFourthSpellCastPerTurnRelicTriggers,
  applyPotionPlayedRelicTriggers,
} from '../relics/triggers'

export function playCard(state: GameState, cardInstanceId: CardInstanceId): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }
  const inst = state.player.deck.cardById[cardInstanceId]
  if (!inst) return { state, events: [] }
  if (!state.player.deck.hand.includes(cardInstanceId)) return { state, events: [] }
  if (cardInstanceLooksExhausted(inst)) return { state, events: [] }
  const tmpl = Cards[inst.templateId]
  const inkOpts = { freeFirstFireSpell: state.combat.freeFirstFireSpell, nextSpellCosts0: state.combat.nextSpellCosts0 }
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
      if (handSelectionEffect.kind === 'UPGRADE_SELECTED_CARD' && !isCardInstanceUpgradeable(candidate)) continue
      seenEligible.add(id)
      eligibleIds.push(id)
    }
    const maxPicks = Math.min(handSelectionEffect.numberOfTargets, eligibleIds.length)
    if (maxPicks <= 0 && handSelectionEffect.kind !== 'CONSUME_SELECTED_CARD') return { state, events: [] }

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

  const cardPlayedRelics = applyCardPlayedRelicTriggers(s0)
  let s0b: GameState = cardPlayedRelics.state

  let potionRelicEvents: GameEvent[] = [...cardPlayedRelics.events]
  if (isPotionCardId(inst.templateId)) {
    const potionRelics = applyPotionPlayedRelicTriggers(s0b)
    s0b = potionRelics.state
    potionRelicEvents = potionRelics.events
  }

  const printedInkCost = inst.costOverride ?? tmpl.cost
  const inkCostRelics = applyCastSpellWithCostAboveAmountRelicTriggers(s0b, printedInkCost)
  s0b = inkCostRelics.state
  const inkCostRelicEvents = inkCostRelics.events

  let s1: GameState = {
    ...s0b,
    player: { ...s0b.player, energy: s0b.player.energy - cost },
  }
  if (s1.combat?.nextSpellCosts0) {
    s1 = { ...s1, combat: { ...s1.combat, nextSpellCosts0: false } }
  }
  if (cardHasFireTag(tmpl.tags)) {
    s1 = consumeFreeFirstFireSpellIfFireCard(s1, tmpl)
  }

  let events: GameEvent[] = [{ type: 'EVT/CARD_PLAYED', cardInstanceId }, ...potionRelicEvents, ...inkCostRelicEvents]
  if (cost > 0) events.push({ type: 'EVT/ENERGY_SPENT', amount: cost })

  // Rule: cards resolve first, then go to discard. Critical roll precedes other card effects.
  const effectsForCast = cardPlayEffectsWithRelicCritical(s1, tmpl, scaled)
  const critRoll = applyCriticalRollToCardEffects(s1, effectsForCast, tmpl.tags)
  const outFx = applyEffects(critRoll.state, critRoll.effects, { selectedEnemyId, playedCardInstanceId: cardInstanceId }, {
    powerBoostsCardAddBunnies: true,
    shieldPowerBoostsCardGainShield: true,
    firepowerBoostsCardDealDamage: true,
  })
  events = events.concat(critRoll.events, outFx.events)

  let sAfterFx = outFx.state
  if (cardInstanceUpgradesAfterCasting(inst)) {
    sAfterFx = upgradeCardInstance(sAfterFx, cardInstanceId, 1)
  }

  const consumes = cardInstanceConsumes(inst)
  const phasesOut = cardPlayPhasesOut(inst, scaled)
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
        const combat0 = sAfterFx.combat
        return {
          ...sAfterFx,
          combat:
            phasesOut && combat0
              ? { ...combat0, phasedOut: [...combat0.phasedOut, cardInstanceId] }
              : combat0,
          player: {
            ...sAfterFx.player,
            deck: {
              ...sAfterFx.player.deck,
              cardById: cardById2,
              hand: hand2,
              discardPile: phasesOut ? sAfterFx.player.deck.discardPile : [...sAfterFx.player.deck.discardPile, cardInstanceId],
            },
          },
        }
      })()

  const combatAfter = sAfterDiscard.combat
  let sCounted: GameState = sAfterDiscard
  if (combatAfter) {
    sCounted = {
      ...sAfterDiscard,
      combat: { ...combatAfter, cardsPlayedThisTurn: combatAfter.cardsPlayedThisTurn + 1 },
    }
  }

  const fourth = applyFourthSpellCastPerTurnRelicTriggers(sCounted)
  const s4 = setPhase(fourth.state, 'COMBAT_PLAYER_READY')

  const phaseEvents: GameEvent[] = phasesOut ? [{ type: 'EVT/CARD_PHASED_OUT', cardInstanceId }] : []
  return { state: s4, events: events.concat(phaseEvents, fourth.events) }
}

