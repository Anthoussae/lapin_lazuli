import type { CardInstance } from '../../core/types/state'
import type { GemId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { cardInstanceResolvedPlayEffects } from './cardEffects'
import { boostFireDealDamage, cardHasFireDamageTags } from './firepower'

const RUBY_GEM_ID: GemId = 'RUBY'

/** Keep in sync with `--fire-release-sprite-max` in tokens.css. */
export const FIRE_RELEASE_SPRITE_MAX = 50

/** True when this card instance deals fire damage on play (template and/or socketed gem). */
export function cardInstanceHasFireDamage(inst: CardInstance, tags: ReadonlyArray<string>): boolean {
  return fireCardPlayDamage(inst, tags, 0) > 0
}

/** Resolved fire DEAL_DAMAGE total for one card play (upgrades, foil, then firepower). */
export function fireCardPlayDamage(
  inst: CardInstance,
  tags: ReadonlyArray<string>,
  firepowerMultiplier: number,
): number {
  const card = Cards[inst.templateId]
  if (!card) return 0

  const hasFireTags = cardHasFireDamageTags(tags)
  const hasRuby = inst.socketedGemId === RUBY_GEM_ID
  if (!hasFireTags && !hasRuby) return 0

  let total = 0
  for (const fx of cardInstanceResolvedPlayEffects(inst)) {
    if (fx.kind !== 'DEAL_DAMAGE') continue
    total += hasFireTags ? boostFireDealDamage(fx.amount, firepowerMultiplier) : fx.amount
  }
  return total
}

/** Spark sprites for one burst: damage dealt, capped at {@link FIRE_RELEASE_SPRITE_MAX}. */
export function fireReleaseSpriteCount(damage: number): number {
  const n = Math.max(0, Math.trunc(damage))
  return Math.min(n, FIRE_RELEASE_SPRITE_MAX)
}
