import type { CardId, CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import type { Effect } from '../../data/effects'
import { foilCardEffectAmounts, foilCardEffectUpgradeValues } from './foil'

export function isCardUpgradeable(templateId: CardId): boolean {
  return !Cards[templateId]?.unupgradeable
}

function ceilScaledAmount(base: number, perUpgrade: number, upgrades: number): number {
  return Math.ceil(base + perUpgrade * upgrades)
}

function effectUpgradePerTier(fx: Effect): number {
  return fx.upgradeValue ?? 0
}

function scaleEffect(fx: Effect, upgrades: number): Effect {
  const per = effectUpgradePerTier(fx)
  if (per <= 0) return fx

  if (
    fx.kind === 'UPGRADE_SELECTED_CARD' ||
    fx.kind === 'CONSUME_SELECTED_CARD' ||
    fx.kind === 'UPGRADE_SPECIFIC_CARD'
  ) {
    return { ...fx, numberOfTargets: fx.numberOfTargets + per * upgrades }
  }

  if ('amount' in fx) {
    return { ...fx, amount: ceilScaledAmount(fx.amount, per, upgrades) }
  }

  return fx
}

/** Applies each effect's `upgradeValue` for the given instance upgrade counter. */
export function scaleCardEffects(effects: ReadonlyArray<Effect>, upgrades: number): ReadonlyArray<Effect> {
  if (upgrades <= 0) return effects
  return effects.map((fx) => scaleEffect(fx, upgrades))
}

/**
 * Card + gem effects with instance upgrades and optional foil.
 * Order: foil upgradeValues → upgrade scaling → foil amounts (before power/fire/shield boosts).
 */
export function applyCardInstanceEffectModifiers(
  effects: ReadonlyArray<Effect>,
  upgrades: number,
  foil: boolean,
): ReadonlyArray<Effect> {
  let scaled = effects
  if (foil) scaled = foilCardEffectUpgradeValues(scaled)
  scaled = scaleCardEffects(scaled, upgrades)
  if (foil) scaled = foilCardEffectAmounts(scaled)
  return scaled
}

export function upgradeCardInstance(state: GameState, cardInstanceId: CardInstanceId, amount: number): GameState {
  const inst = state.player.deck.cardById[cardInstanceId]
  if (!inst || !isCardUpgradeable(inst.templateId) || amount <= 0) return state
  const next = { ...inst, upgrades: inst.upgrades + amount }
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
