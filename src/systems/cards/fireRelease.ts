import type { CardInstance } from '../../core/types/state'
import type { GemId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { Gems } from '../../data/gems'
import type { Effect } from '../../data/effects'
import { effectsResolvedOnCardPlay } from './cardEffects'
import { boostFireDealDamage, cardHasFireDamageTags } from './firepower'
import { scaleCardEffects } from './upgrades'

/** Keep in sync with `--fire-release-sprite-max` in tokens.css. */
export const FIRE_RELEASE_SPRITE_MAX = 50

const RUBY_GEM_ID: GemId = 'RUBY'

function sumFireDealDamage(
  effects: ReadonlyArray<Effect>,
  upgrades: number,
  tags: ReadonlyArray<string>,
  firepowerMultiplier: number,
): number {
  let total = 0
  for (const fx of scaleCardEffects(effects, upgrades)) {
    if (fx.kind !== 'DEAL_DAMAGE') continue
    const amount = cardHasFireDamageTags(tags)
      ? boostFireDealDamage(fx.amount, firepowerMultiplier)
      : fx.amount
    total += amount
  }
  return total
}

/** True when this card instance deals fire damage on play (template and/or Ruby). */
export function cardInstanceHasFireDamage(inst: CardInstance, tags: ReadonlyArray<string>): boolean {
  return fireCardPlayDamage(inst, tags, 0) > 0
}

/** Resolved fire DEAL_DAMAGE total for one card play (upgrades + firepower). */
export function fireCardPlayDamage(
  inst: CardInstance,
  tags: ReadonlyArray<string>,
  firepowerMultiplier: number,
): number {
  const card = Cards[inst.templateId]
  if (!card) return 0

  let total = 0
  if (cardHasFireDamageTags(tags)) {
    total += sumFireDealDamage(
      effectsResolvedOnCardPlay(card.effects),
      inst.upgrades,
      tags,
      firepowerMultiplier,
    )
  }

  if (inst.socketedGemId === RUBY_GEM_ID) {
    const ruby = Gems[RUBY_GEM_ID]
    total += sumFireDealDamage(
      effectsResolvedOnCardPlay(ruby.effects),
      inst.upgrades,
      tags,
      firepowerMultiplier,
    )
  }

  return total
}

/** Spark sprites for one burst: damage dealt, capped at {@link FIRE_RELEASE_SPRITE_MAX}. */
export function fireReleaseSpriteCount(damage: number): number {
  const n = Math.max(0, Math.trunc(damage))
  return Math.min(n, FIRE_RELEASE_SPRITE_MAX)
}
