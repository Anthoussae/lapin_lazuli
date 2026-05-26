import type { RngState } from '../../core/rng/rng'
import { rngInt } from '../../core/rng/rng'
import type { CardInstance, GameState } from '../../core/types/state'
import { isBurdenCardId, isPotionCardId } from '../../data/cards'

/** All card instances still in the player's deck (draw, hand, discard; excludes consumed / removed). */
export function playerOwnedCardInstances(state: GameState): ReadonlyArray<CardInstance> {
  return Object.values(state.player.deck.cardById)
}

/** Heuristic score for picking a “best” owned card; higher is better. */
export function cardInstanceBestnessWeight(inst: CardInstance): number {
  let weight = 0
  if (inst.socketedGemId != null) weight += 4
  if (inst.foil === true) weight += 3
  if (inst.sticker === true) weight += 2
  if (inst.upgrades > 0) weight += inst.upgrades
  if (isPotionCardId(inst.templateId)) weight -= 1
  if (isBurdenCardId(inst.templateId)) weight -= 2
  return weight
}

/**
 * Picks one card from `instances` with the highest {@link cardInstanceBestnessWeight}.
 * Ties are broken with seeded RNG.
 */
export function determineBestCard(
  rng: RngState,
  instances: ReadonlyArray<CardInstance>,
): readonly [RngState, CardInstance | null] {
  if (instances.length === 0) return [rng, null]

  let maxWeight = Number.NEGATIVE_INFINITY
  const tied: CardInstance[] = []

  for (const inst of instances) {
    const w = cardInstanceBestnessWeight(inst)
    if (w > maxWeight) {
      maxWeight = w
      tied.length = 0
      tied.push(inst)
    } else if (w === maxWeight) {
      tied.push(inst)
    }
  }

  if (tied.length === 0) return [rng, null]
  if (tied.length === 1) return [rng, tied[0] ?? null]

  const [r2, idx] = rngInt(rng, 0, tied.length)
  return [r2, tied[idx] ?? null]
}

/** {@link determineBestCard} over every card still in the player's deck. */
export function determineBestOwnedCard(
  rng: RngState,
  state: GameState,
): readonly [RngState, CardInstance | null] {
  return determineBestCard(rng, playerOwnedCardInstances(state))
}
