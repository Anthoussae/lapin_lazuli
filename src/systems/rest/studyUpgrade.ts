import type { CardInstanceId } from '../../core/types/ids'
import type { RngState } from '../../core/rng/rng'
import { rngInt } from '../../core/rng/rng'
import type { GameState, RestOutcomeState } from '../../core/types/state'
import { isCardUpgradeable, upgradeCardInstance } from '../cards/upgrades'

export function describeStudyTooltip(): string {
  return 'Upgrade one random card.'
}

export function restChoiceMade(rest: RestOutcomeState): boolean {
  return rest.slept || rest.studied
}

export function upgradeableDeckCardIds(state: GameState): ReadonlyArray<CardInstanceId> {
  return Object.values(state.player.deck.cardById)
    .filter((c) => isCardUpgradeable(c.templateId))
    .map((c) => c.id)
    .sort()
}

export function pickRandomUpgradeableDeckCard(
  rng: RngState,
  candidates: ReadonlyArray<CardInstanceId>,
): readonly [RngState, CardInstanceId | null] {
  if (!candidates.length) return [rng, null]
  const [r2, idx] = rngInt(rng, 0, candidates.length)
  return [r2, candidates[idx] ?? null]
}

export function applyRandomStudyUpgrade(state: GameState): {
  state: GameState
  upgradedCardInstanceId: CardInstanceId | null
} {
  const candidates = upgradeableDeckCardIds(state)
  const [r2, picked] = pickRandomUpgradeableDeckCard(state.rng, candidates)
  if (!picked) return { state: { ...state, rng: r2 }, upgradedCardInstanceId: null }
  const upgraded = upgradeCardInstance({ ...state, rng: r2 }, picked, 1)
  return { state: upgraded, upgradedCardInstanceId: picked }
}
