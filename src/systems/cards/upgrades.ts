import type { CardId, CardInstanceId } from '../../core/types/ids'
import type { RngState } from '../../core/rng/rng'
import { rngInt } from '../../core/rng/rng'
import type { CardInstance, GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import type { Effect } from '../../data/effects'
import { foilCardEffectAmounts, foilCardEffectUpgradeValues } from './foil'

export function isCardUpgradeable(templateId: CardId): boolean {
  return !Cards[templateId]?.unupgradeable
}

export function isCardInstanceUpgradeable(inst: CardInstance): boolean {
  return inst.unupgradable !== true && isCardUpgradeable(inst.templateId)
}

function ceilScaledAmount(base: number, perUpgrade: number, upgrades: number): number {
  return Math.ceil(base + perUpgrade * upgrades)
}

/** Bunny multipliers scale exactly; only the post-multiply bunny count is rounded up. */
function exactScaledAmount(base: number, perUpgrade: number, upgrades: number): number {
  return base + perUpgrade * upgrades
}

function effectUpgradePerTier(fx: Effect): number {
  return fx.upgradeValue ?? 0
}

function scaleEffect(fx: Effect, upgrades: number): Effect {
  if (fx.kind === 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL') {
    if (fx.multiplierUpgradePerLevel <= 0) return fx
    return {
      ...fx,
      multiplier: fx.multiplier + fx.multiplierUpgradePerLevel * upgrades,
    }
  }

  if (fx.kind === 'CRITICAL') {
    return {
      ...fx,
      chancePercent: ceilScaledAmount(fx.chancePercent, fx.chanceUpgradeValue, upgrades),
      multiplierPercent: ceilScaledAmount(fx.multiplierPercent, fx.multiplierUpgradeValue, upgrades),
    }
  }

  const per = effectUpgradePerTier(fx)
  if (per <= 0) return fx

  if (
    fx.kind === 'UPGRADE_SELECTED_CARD' ||
    fx.kind === 'CONSUME_SELECTED_CARD' ||
    fx.kind === 'UPGRADE_SPECIFIC_CARD' ||
    fx.kind === 'UPGRADE_RANDOM_DECK_CARDS'
  ) {
    return { ...fx, numberOfTargets: fx.numberOfTargets + per * upgrades }
  }

  if ('amount' in fx) {
    if (typeof fx.amount !== 'number') return fx
    const scale =
      fx.kind === 'MULTIPLY_BUNNIES' ? exactScaledAmount : ceilScaledAmount
    return { ...fx, amount: scale(fx.amount, per, upgrades) }
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
  if (!inst || !isCardInstanceUpgradeable(inst) || amount <= 0) return state
  const next = { ...inst, upgrades: inst.upgrades + amount }
  return {
    ...state,
    runStats: { ...state.runStats, totalCardUpgrades: state.runStats.totalCardUpgrades + amount },
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
    if (!inst || !isCardInstanceUpgradeable(inst)) return
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

export function upgradeableDeckCardIds(state: GameState): ReadonlyArray<CardInstanceId> {
  return Object.values(state.player.deck.cardById)
    .filter((c) => isCardInstanceUpgradeable(c))
    .map((c) => c.id)
    .sort()
}

function pickRandomUpgradeableDeckCards(
  rng: RngState,
  candidates: ReadonlyArray<CardInstanceId>,
  count: number,
): readonly [RngState, CardInstanceId[]] {
  const pool = [...candidates]
  const picked: CardInstanceId[] = []
  const n = Math.min(count, pool.length)
  let r = rng
  for (let i = 0; i < n; i++) {
    const [r2, idx] = rngInt(r, 0, pool.length)
    r = r2
    const card = pool[idx]
    if (!card) break
    picked.push(card)
    pool.splice(idx, 1)
  }
  return [r, picked]
}

/** Upgrade up to `numberOfTargets` distinct random upgradeable cards in the deck (fewer if the deck is smaller). */
export function upgradeRandomDeckCards(
  state: GameState,
  numberOfTargets: number,
  upgradeAmount: number,
): GameState {
  if (numberOfTargets <= 0 || upgradeAmount <= 0) return state
  const candidates = upgradeableDeckCardIds(state)
  const [r2, ids] = pickRandomUpgradeableDeckCards(state.rng, candidates, numberOfTargets)
  let s: GameState = { ...state, rng: r2 }
  for (const id of ids) s = upgradeCardInstance(s, id, upgradeAmount)
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
    .filter((c) => c.templateId === targetTemplateId && isCardInstanceUpgradeable(c))
    .map((c) => c.id)
  if (!ids.length) return state

  // Deterministic: upgrade lowest ids first.
  ids.sort()
  let s = state
  for (const id of ids.slice(0, numberOfTargets)) s = upgradeCardInstance(s, id, upgradeAmount)
  return s
}
