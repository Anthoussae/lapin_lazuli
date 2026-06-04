import type { GameState } from '../../core/types/state'
import type { CardTemplate } from '../../data/cards'
import type { Effect } from '../../data/effects'
import { Relics } from '../../data/relics'

function normalizeCardNameKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '')
}

function cardMatchesNamedCardTrigger(card: CardTemplate, cardName: string): boolean {
  return normalizeCardNameKey(card.name) === normalizeCardNameKey(cardName)
}

/** CRITICAL effects from `onCastNamedCard` relic triggers for this cast (not applied via {@link applyRelicEffect}). */
export function relicCriticalEffectsOnCastNamedCard(
  state: GameState,
  card: CardTemplate,
): ReadonlyArray<Effect> {
  const out: Effect[] = []
  for (const rInst of state.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'onCastNamedCard') continue
      const name = trig.cardName
      if (!name || !cardMatchesNamedCardTrigger(card, name)) continue
      if (trig.effect.kind === 'CRITICAL') out.push(trig.effect)
    }
  }
  return out
}

/** Relic critical is rolled before other card effects (prepended for aggregation). */
export function cardPlayEffectsWithRelicCritical(
  state: GameState,
  card: CardTemplate,
  resolvedEffects: ReadonlyArray<Effect>,
): ReadonlyArray<Effect> {
  const relicCrit = relicCriticalEffectsOnCastNamedCard(state, card)
  if (relicCrit.length === 0) return resolvedEffects
  return [...relicCrit, ...resolvedEffects]
}
