import type { CardId, CardInstanceId } from '../core/types/ids'
import type { CardInstance } from '../core/types/state'
import type { Effect } from './effects'
import { mkCardInstance } from '../systems/factories'

export type CardTemplate = Readonly<{
  id: CardId
  name: string
  starter: boolean
  /**
   * When `starter` is true, how many copies are shuffled into the initial deck at new game.
   * Omit or `0` means the card is starter-flagged for offers only and is not in the opening deck.
   */
  starterDeckNumber?: number
  /** Weight in random card rewards & shop rows. Use `0` for burdens (only added by explicit effects). */
  poolFrequency: number
  /** Null ink cost: cannot be cast; clutters the hand. */
  cost: number | null
  exhaust?: boolean
  /** When true, this card is not discarded from hand at player turn end. */
  retain?: boolean
  /** When true, this card is consumed if still in hand at player turn end. */
  expire?: boolean
  tags: ReadonlyArray<string>
  effects: ReadonlyArray<Effect>
  /** When true, upgrade effects and hand selection for upgrades skip this card. */
  unupgradeable?: boolean
  /** When true, this card cannot be chosen for gem socketing. */
  unsocketable?: boolean
  /** When true, card art uses full-color potion styling (not silhouetted). */
  potion?: boolean
  /** Applied when this card is acquired outside combat (rewards, shop, etc.). */
  pickupEffects?: ReadonlyArray<Effect>
}>

export const Cards: Readonly<Record<CardId, CardTemplate>> = {
  BUNNYMANCY: {
    id: 'BUNNYMANCY',
    name: 'Bunnymancy',
    starter: true,
    starterDeckNumber: 5,
    poolFrequency: 4,
    cost: 1,
    tags: ['addBunnies'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 6, upgradeValue: 1 }],
  },
  MULTIBUNNIES: {
    id: 'MULTIBUNNIES',
    name: 'Multibunnies',
    starter: true,
    starterDeckNumber: 1,
    poolFrequency: 1,
    cost: 2,
    tags: ['multBunnies'],
    effects: [{ kind: 'MULTIPLY_BUNNIES', amount: 2, upgradeValue: 1 }],
  },
  PRACTICE: {
    id: 'PRACTICE',
    name: 'Practice',
    starter: true,
    starterDeckNumber: 1,
    poolFrequency: 0,
    cost: 2,
    exhaust: true,
    retain: true,
    tags: ['upgrade'],
    effects: [
      { kind: 'UPGRADE_SELECTED_CARD', numberOfTargets: 1, upgradeAmount: 1, upgradeValue: 1 },
      { kind: 'DESTINY', upgradeValue: 1 },
    ],
  },
  PONDER: {
    id: 'PONDER',
    name: 'Ponder',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    tags: ['drawcards'],
    effects: [{ kind: 'DRAW_CARDS', amount: 3, upgradeValue: 1 }],
  },
  DODGE: {
    id: 'DODGE',
    name: 'Dodge',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    tags: ['addShield', 'drawcards'],
    effects: [
      { kind: 'GAIN_SHIELD', amount: 2, upgradeValue: 1 },
      { kind: 'DRAW_CARDS', amount: 1, upgradeValue: 1 },
    ],
  },
  WISE_BUNNIES: {
    id: 'WISE_BUNNIES',
    name: 'Wise Bunnies',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    tags: ['drawcards', 'addBunnies'],
    effects: [
      { kind: 'ADD_BUNNIES', amount: 3, upgradeValue: 1 },
      { kind: 'DRAW_CARDS', amount: 2, upgradeValue: 1 },
    ],
  },
  INKSWELL: {
    id: 'INKSWELL_RITUAL',
    name: 'Inkswell Ritual',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    exhaust: true,
    tags: ['generateInk'],
    effects: [{ kind: 'GAIN_INK', amount: 3, upgradeValue: 1 }],
  },
  CLOUDBUNNY: {
    id: 'CLOUDBUNNY',
    name: 'Cloudbunny',
    starter: false,
    poolFrequency: 2,
    cost: 0,
    exhaust: false,
    tags: ['addBunnies'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 1, upgradeValue: 1 }],
  },
  HEALTH_POTION: {
    id: 'HEALTH_POTION',
    name: 'Health Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['heal', 'consume'],
    effects: [{ kind: 'HEAL', amount: 10, upgradeValue: 1 }],
  },
  LETHEAN_WATER: {
    id: 'LETHEAN_WATER',
    name: 'Lethean Water',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    potion: true,
    tags: ['consume'],
    effects: [{ kind: 'CONSUME_SELECTED_CARD', numberOfTargets: 1, upgradeValue: 1 }],
  },
  DEFEND: {
    id: 'DEFEND',
    name: 'Defend',
    starter: true,
    starterDeckNumber: 4,
    poolFrequency: 5,
    cost: 1,
    tags: ['addShield'],
    effects: [{ kind: 'GAIN_SHIELD', amount: 8, upgradeValue: 1 }],
  },
  SHIELD_POTION: {
    id: 'SHIELD_POTION',
    name: 'Shield Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['addShield', 'consume'],
    effects: [{ kind: 'GAIN_SHIELD', amount: 30, upgradeValue: 1 }],
  },
  FIREBALL: {
    id: 'FIREBALL',
    name: 'Fireball',
    starter: false,
    poolFrequency: 3,
    cost: 1,
    tags: ['damage', 'fire'],
    effects: [{ kind: 'DEAL_DAMAGE', amount: 10, upgradeValue: 1 }],
  },
  FORTRESS: {
    id: 'FORTRESS',
    name: 'Fortress',
    starter: false,
    poolFrequency: 2,
    cost: 0,
    tags: ['addShield', 'lockShield'],
    effects: [
      { kind: 'GAIN_SHIELD', amount: 4, upgradeValue: 1 },
      { kind: 'LOCK_ALL_SHIELD' },
    ],
  },
  FIREBALL_POTION: {
    id: 'FIREBALL_POTION',
    name: 'Fireball Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['damage', 'fire', 'consume'],
    effects: [{ kind: 'DEAL_DAMAGE', amount: 30, upgradeValue: 1 }],
  },
  SQUID_POTION: {
    id: 'SQUID_POTION',
    name: 'Squid Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['generateInk', 'consume'],
    effects: [{ kind: 'GAIN_INK', amount: 2, upgradeValue: 1 }],
  },
  BUNNY_POTION: {
    id: 'BUNNY_POTION',
    name: 'Bunny Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['addBunnies', 'consume'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 15, upgradeValue: 1 }],
  },
  WISDOM_POTION: {
    id: 'WISDOM_POTION',
    name: 'Wisdom Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['upgrade', 'consume'],
    effects: [{ kind: 'UPGRADE_SELECTED_CARD', numberOfTargets: 1, upgradeAmount: 1, upgradeValue: 1 }],
  },
  /** Burden: bad card; `poolFrequency: 0` — never drafted; only granted by effects. */
  LEAD_INGOT: {
    id: 'LEAD_INGOT',
    name: 'Lead ingot',
    starter: false,
    poolFrequency: 0,
    cost: 3,
    unupgradeable: true,
    unsocketable: true,
    tags: ['burden', 'consume'],
    effects: [],
  },
  CLUTTER: {
    id: 'CLUTTER',
    name: 'Clutter',
    starter: false,
    poolFrequency: 0,
    cost: null,
    unupgradeable: true,
    unsocketable: true,
    tags: ['burden', 'unplayable'],
    effects: [],
  },
  SMOKE: {
    id: 'SMOKE',
    name: 'Smoke',
    starter: false,
    poolFrequency: 0,
    cost: null,
    unupgradeable: true,
    unsocketable: true,
    expire: true,
    tags: ['burden', 'unplayable'],
    effects: [],
  },
  STONESKIN: {
    id: 'STONESKIN',
    name: 'Stoneskin',
    starter: false,
    poolFrequency: 1,
    
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [{ kind: 'APPLY_ENCHANTMENT', enchantmentId: 'STONESKIN', target: 'self', amount: 2, upgradeValue: 1 }],
  },
  HARE_RAISING: {
    id: 'HARE_RAISING',
    name: 'Hare-raising',
    starter: false,
    poolFrequency: 1,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [
      { kind: 'APPLY_ENCHANTMENT', enchantmentId: 'HARE_RAISING', target: 'self', amount: 1, upgradeValue: 1 },
    ],
  },
  WARM: {
    id: 'WARM',
    name: 'Warm',
    starter: false,
    poolFrequency: 1,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment', 'fire'],
    effects: [{ kind: 'APPLY_ENCHANTMENT', enchantmentId: 'WARM', target: 'self', amount: 1, upgradeValue: 1 }],
  },
  POISON: {
    id: 'POISON',
    name: 'Poison',
    starter: true,
    starterDeckNumber: 1,
    poolFrequency: 1,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [{ kind: 'APPLY_ENCHANTMENT', enchantmentId: 'POISON', target: 'opponent', amount: 4, upgradeValue: 2 }],
  },
  CROWN_OF_FLAMES: {
    id: 'CROWN_OF_FLAMES',
    name: 'Crown of Flames',
    starter: true,
    starterDeckNumber: 1,
    poolFrequency: 1,
    cost: 1,
    unsocketable: true,
    tags: ['fire', 'enchantment'],
    effects: [
      { kind: 'APPLY_ENCHANTMENT', enchantmentId: 'FLAMEWREATH', target: 'self', amount: 6, upgradeValue: 3 },
    ],
  },
  GUARDIAN_ANGEL: {
    id: 'GUARDIAN_ANGEL',
    name: 'Guardian Angel',
    starter: false,
    poolFrequency: 1,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [
      { kind: 'APPLY_ENCHANTMENT', enchantmentId: 'GUARDIAN_ANGEL', target: 'self', amount: 4, upgradeValue: 2 },
    ],
  },
  CONFLAGRATION: {
    id: 'CONFLAGRATION',
    name: 'Conflagration',
    starter: false,
    poolFrequency: 1,
    cost: 4,
    tags: ['damage', 'fire'],
    effects: [{ kind: 'DEAL_DAMAGE', amount: 50, upgradeValue: 12 }],
  },
  SMOG: {
    id: 'SMOG',
    name: 'Smog',
    starter: true,
    starterDeckNumber: 1,
    poolFrequency: 1,
    cost: 2,
    tags: ['poison'],
    effects: [{ kind: 'HP_LOSS', target: 'selectedEnemy', amount: 12, upgradeValue: 6 }],
  },
  DISPEL: {
    id: 'DISPEL',
    name: 'Dispel',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    tags: ['dispel'],
    effects: [{ kind: 'DISPEL', amount: 1 }],
  },
}

export function cardTemplateById(templateId: CardId): CardTemplate | undefined {
  const direct = Cards[templateId]
  if (direct) return direct
  return Object.values(Cards).find((card) => card.id === templateId)
}

/** Potion cards use full-color illustrations; other cards use silhouetted art. */
export function isPotionCardId(cardId: CardId | undefined): boolean {
  if (cardId == null) return false
  return cardTemplateById(cardId)?.potion === true
}

/** All potion templates (for random potion rolls). */
export function allPotionCardIds(): CardId[] {
  return (Object.keys(Cards) as CardId[]).filter((id) => Cards[id]?.potion === true)
}

export function isBurdenCardId(cardId: CardId | undefined): boolean {
  if (cardId == null) return false
  return cardTemplateById(cardId)?.tags.includes('burden') === true
}

export type StarterDeckBuild = Readonly<{
  cardById: Readonly<Record<CardInstanceId, CardInstance>>
  drawPile: ReadonlyArray<CardInstanceId>
}>

/** Opening deck from every `starter` card with `starterDeckNumber` > 0 (deterministic card-id order). */
export function buildStarterDeck(): StarterDeckBuild {
  const instances: CardInstance[] = []
  let serial = 1
  const ids = (Object.keys(Cards) as CardId[]).sort()
  for (const id of ids) {
    const t = Cards[id]
    if (!t.starter) continue
    const n = t.starterDeckNumber ?? 0
    if (n <= 0) continue
    for (let i = 0; i < n; i++) {
      instances.push(mkCardInstance(`sd${serial++}` as CardInstanceId, id))
    }
  }
  const cardById: Record<CardInstanceId, CardInstance> = Object.fromEntries(instances.map((c) => [c.id, c]))
  const drawPile: CardInstanceId[] = instances.map((c) => c.id)
  return { cardById, drawPile }
}
