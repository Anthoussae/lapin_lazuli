import type { GemId } from '../core/types/ids'
import type { CardTemplate } from '../data/cards'
import type { Effect } from '../data/effects'
import type { GemTemplate } from '../data/gems'
import { cardBaseEffects } from '../systems/cards/cardEffects'

export type CardKeywordId =
  | 'exhaust'
  | 'retain'
  | 'expire'
  | 'consume'
  | 'destiny'
  | 'unupgradable'
  | 'enchantment'
  | 'critical'
  | 'piercing'
  | 'socketed'

export type CardKeywordDef = Readonly<{
  id: CardKeywordId
  label: string
  tooltip: string
}>

/** Display order for keyword lines on cards. */
export const CARD_KEYWORD_ORDER: ReadonlyArray<CardKeywordId> = [
  'enchantment',
  'socketed',
  'critical',
  'piercing',
  'exhaust',
  'retain',
  'expire',
  'consume',
  'destiny',
  'unupgradable',
]

/** Tooltip for foiled card instances (printer room). */
export const FOIL_CARD_TOOLTIP: Readonly<{ label: string; tooltip: string }> = {
  label: 'Foil',
  tooltip: '50% enhanced values',
}

export const CARD_KEYWORDS: Record<CardKeywordId, CardKeywordDef> = {
  enchantment: {
    id: 'enchantment',
    label: 'Enchantment',
    tooltip: 'Persists until the end of combat.',
  },
  socketed: {
    id: 'socketed',
    label: 'Socketed',
    tooltip: 'Cannot be upgraded',
  },
  critical: {
    id: 'critical',
    label: 'Critical',
    tooltip:
      'When cast, has a chance to multiply all of this card\'s values.',
  },
  piercing: {
    id: 'piercing',
    label: 'Piercing',
    tooltip: 'Ignores shields.',
  },
  exhaust: {
    id: 'exhaust',
    label: 'Exhaust',
    tooltip: 'This card may only be played once per combat',
  },
  retain: {
    id: 'retain',
    label: 'Retain',
    tooltip: "This card is not discarded at turn's end.",
  },
  expire: {
    id: 'expire',
    label: 'Expire',
    tooltip: 'If this card is in your hand at the end of your turn, it is consumed.',
  },
  consume: {
    id: 'consume',
    label: 'Consume',
    tooltip: 'Permanently destroy the consumed card.',
  },
  destiny: {
    id: 'destiny',
    label: 'Destiny',
    tooltip: 'Draw this card at the start of combat.',
  },
  unupgradable: {
    id: 'unupgradable',
    label: 'Unupgradable',
    tooltip: "This card can't be upgraded.",
  },
}

const KEYWORD_EFFECT_KINDS = new Set<Effect['kind']>(['EXHAUST', 'DESTINY'])

export function isKeywordEffectKind(kind: Effect['kind']): boolean {
  return KEYWORD_EFFECT_KINDS.has(kind)
}

export function keywordIdsFromEffects(effects: ReadonlyArray<Effect>): CardKeywordId[] {
  const found = new Set<CardKeywordId>()
  for (const fx of effects) {
    if (fx.kind === 'EXHAUST') found.add('exhaust')
    if (fx.kind === 'DESTINY') found.add('destiny')
    if (fx.kind === 'CRITICAL') found.add('critical')
  }
  return CARD_KEYWORD_ORDER.filter((id) => found.has(id))
}

export function cardKeywordIds(
  card: CardTemplate,
  socketedGemId: GemId | null = null,
  grantedExpire = false,
): CardKeywordId[] {
  const found = new Set<CardKeywordId>()
  if (socketedGemId != null) found.add('socketed')
  if (cardBaseEffects(card.id, socketedGemId).some((fx) => fx.kind === 'APPLY_ENCHANTMENT')) {
    found.add('enchantment')
  }
  if (card.exhaust || cardBaseEffects(card.id, socketedGemId).some((fx) => fx.kind === 'EXHAUST')) {
    found.add('exhaust')
  }
  if (card.retain) found.add('retain')
  if (card.expire || grantedExpire) found.add('expire')
  if (card.tags.includes('consume')) found.add('consume')
  if (cardBaseEffects(card.id, socketedGemId).some((fx) => fx.kind === 'DESTINY')) {
    found.add('destiny')
  }
  if (card.unupgradeable) found.add('unupgradable')
  if (
    card.tags.includes('critical') ||
    cardBaseEffects(card.id, socketedGemId).some((fx) => fx.kind === 'CRITICAL')
  ) {
    found.add('critical')
  }
  if (card.tags.includes('piercing')) found.add('piercing')
  return CARD_KEYWORD_ORDER.filter((id) => found.has(id))
}

export function gemKeywordIds(gem: GemTemplate): CardKeywordId[] {
  return keywordIdsFromEffects(gem.effects)
}

export function collectKeywordIdsFromDescriptionLines(
  lines: ReadonlyArray<{ kind: string; ids?: ReadonlyArray<CardKeywordId> }>,
): CardKeywordId[] {
  const found = new Set<CardKeywordId>()
  for (const line of lines) {
    if (line.kind === 'keywords' && line.ids) {
      for (const id of line.ids) found.add(id)
    }
  }
  return CARD_KEYWORD_ORDER.filter((id) => found.has(id))
}
