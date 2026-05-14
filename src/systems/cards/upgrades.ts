import type { CardId, CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import type { Effect } from '../../data/effects'

export function isCardUpgradeable(templateId: CardId): boolean {
  return !Cards[templateId]?.unupgradeable
}

/** Upgrade counters added to a card instance after {@link CardTemplate.upgradeMultiplier} (ceiled to an integer). */
export function effectiveCardUpgradeDelta(templateId: CardId, amount: number): number {
  if (amount <= 0) return 0
  const mult = Cards[templateId]?.upgradeMultiplier ?? 1
  return Math.ceil(amount * mult)
}

/** Shop/reward upgrade tiers → same counter units as {@link scaleCardEffects} and card instances. */
export function offeredUpgradeTiersToEffectScaling(templateId: CardId, upgradeApplications: number): number {
  return effectiveCardUpgradeDelta(templateId, upgradeApplications)
}

/** {@code +N} suffix on card names from effect-scaling upgrade counters on instances. */
export function displayUpgradeTierCount(templateId: CardId, effectScalingUpgrades: number): number {
  if (effectScalingUpgrades <= 0) return 0
  const mult = Cards[templateId]?.upgradeMultiplier ?? 1
  if (mult <= 1) return effectScalingUpgrades
  return Math.floor(effectScalingUpgrades / mult)
}

function ceilScaledAmount(base: number, perUpgrade: number, upgrades: number): number {
  return Math.ceil(base + perUpgrade * upgrades)
}

export function scaleCardEffects(effects: ReadonlyArray<Effect>, upgrades: number): ReadonlyArray<Effect> {
  if (upgrades <= 0) return effects
  return effects.map((fx) => {
    if (fx.kind === 'DRAW_CARDS') return { ...fx, amount: ceilScaledAmount(fx.amount, 1, upgrades) }
    if (fx.kind === 'GAIN_INK') return { ...fx, amount: ceilScaledAmount(fx.amount, 1, upgrades) }
    if (fx.kind === 'HEAL') return { ...fx, amount: ceilScaledAmount(fx.amount, 10, upgrades) }
    if (fx.kind === 'GAIN_SHIELD') return { ...fx, amount: ceilScaledAmount(fx.amount, 6, upgrades) }
    if (fx.kind === 'GAIN_LOCKED_SHIELD') return { ...fx, amount: ceilScaledAmount(fx.amount, 4, upgrades) }
    if (fx.kind === 'DEAL_DAMAGE') return { ...fx, amount: ceilScaledAmount(fx.amount, 6, upgrades) }
    if (fx.kind === 'ADD_BUNNIES') return { ...fx, amount: ceilScaledAmount(fx.amount, 3, upgrades) }
    if (fx.kind === 'MULTIPLY_BUNNIES') {
      return { ...fx, amount: ceilScaledAmount(fx.amount, 0.5, upgrades) }
    }
    // Practice+: each card upgrade adds one selectable target; upgrade depth per target stays at template upgradeAmount.
    if (fx.kind === 'UPGRADE_SELECTED_CARD') return { ...fx, numberOfTargets: fx.numberOfTargets + upgrades }
    if (fx.kind === 'CONSUME_SELECTED_CARD') return { ...fx, numberOfTargets: fx.numberOfTargets + upgrades }
    if (fx.kind === 'UPGRADE_SPECIFIC_CARD') return { ...fx, numberOfTargets: fx.numberOfTargets + upgrades }
    return fx
  })
}

export function upgradeCardInstance(state: GameState, cardInstanceId: CardInstanceId, amount: number): GameState {
  const inst = state.player.deck.cardById[cardInstanceId]
  if (!inst || !isCardUpgradeable(inst.templateId)) return state
  const delta = effectiveCardUpgradeDelta(inst.templateId, amount)
  if (delta <= 0) return state
  const next = { ...inst, upgrades: inst.upgrades + delta }
  return {
    ...state,
    player: {
      ...state.player,
      deck: { ...state.player.deck, cardById: { ...state.player.deck.cardById, [cardInstanceId]: next } },
    },
  }
}

export function upgradeSelectedCards(
  state: GameState,
  playedCardInstanceId: CardInstanceId,
  numberOfTargets: number,
  upgradeAmount: number,
): GameState {
  if (numberOfTargets <= 0 || upgradeAmount <= 0) return state

  // Deterministic selection (MVP): hand (excluding played) → draw pile → discard pile.
  const seen = new Set<CardInstanceId>([playedCardInstanceId])
  const candidates: CardInstanceId[] = []
  const pushCandidate = (id: CardInstanceId) => {
    if (seen.has(id)) return
    const inst = state.player.deck.cardById[id]
    if (!inst || !isCardUpgradeable(inst.templateId)) return
    candidates.push(id)
    seen.add(id)
  }
  for (const id of state.player.deck.hand) pushCandidate(id)
  for (const id of state.player.deck.drawPile) pushCandidate(id)
  for (const id of state.player.deck.discardPile) pushCandidate(id)

  let s = state
  for (const id of candidates.slice(0, numberOfTargets)) {
    s = upgradeCardInstance(s, id, upgradeAmount)
  }
  return s
}

export function upgradeSpecificCards(
  state: GameState,
  targetTemplateId: string,
  numberOfTargets: number,
  upgradeAmount: number,
): GameState {
  if (numberOfTargets <= 0 || upgradeAmount <= 0) return state
  const deck = state.player.deck
  const ids = Object.values(deck.cardById)
    .filter((c) => c.templateId === targetTemplateId && isCardUpgradeable(c.templateId))
    .map((c) => c.id)
  if (!ids.length) return state

  // Deterministic: upgrade lowest ids first.
  ids.sort()
  let s = state
  for (const id of ids.slice(0, numberOfTargets)) s = upgradeCardInstance(s, id, upgradeAmount)
  return s
}

