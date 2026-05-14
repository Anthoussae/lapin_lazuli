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
  tags: ReadonlyArray<string>
  effects: ReadonlyArray<Effect>
  /**
   * When this card receives upgrade counters (Practice, relic upgrades, etc.), each applied
   * upgrade amount is multiplied by this value. Defaults to 1 when omitted.
   */
  upgradeMultiplier?: number
  /** When true, upgrade effects and hand selection for upgrades skip this card. */
  unupgradeable?: boolean
  /** When true, this card cannot be chosen for gem socketing. */
  unsocketable?: boolean
  /** Applied when this card is acquired outside combat (rewards, shop, etc.). */
  pickupEffects?: ReadonlyArray<Effect>
}>

export const Cards: Readonly<Record<CardId, CardTemplate>> = {
  BUNNYMANCY: {
    id: 'BUNNYMANCY',
    name: 'Bunnymancy',
    starter: true,
    starterDeckNumber: 6,
    poolFrequency: 5,
    cost: 1,
    tags: ['addBunnies'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 6 }],
  },
  MULTIBUNNIES: {
    id: 'MULTIBUNNIES',
    name: 'Multibunnies',
    starter: true,
    starterDeckNumber: 1,
    poolFrequency: 1,
    cost: 2,
    tags: ['multBunnies'],
    effects: [{ kind: 'MULTIPLY_BUNNIES', amount: 2 }],
  },
  PRACTICE: {
    id: 'PRACTICE',
    name: 'Practice',
    starter: true,
    starterDeckNumber: 1,
    poolFrequency: 0,
    cost: 2,
    exhaust: true,
    tags: ['upgrade'],
    effects: [{ kind: 'DESTINY' }, { kind: 'UPGRADE_SELECTED_CARD', numberOfTargets: 1, upgradeAmount: 1 }],
  },
  PONDER: {
    id: 'PONDER',
    name: 'Ponder',
    starter: false,
    poolFrequency: 4,
    cost: 1,
    tags: ['drawcards'],
    effects: [{ kind: 'DRAW_CARDS', amount: 3 }],
  },
  DODGE: {
    id: 'DODGE',
    name: 'Dodge',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    tags: ['addShield', 'drawcards'],
    effects: [{ kind: 'GAIN_SHIELD', amount: 2 }, { kind: 'DRAW_CARDS', amount: 1 }],
    upgradeMultiplier: 0.7,
  },
  WISE_BUNNIES: {
    id: 'WISE_BUNNIES',
    name: 'Wise Bunnies',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    tags: ['drawcards', 'addBunnies'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 3 }, { kind: 'DRAW_CARDS', amount: 2 }],
    upgradeMultiplier: 0.7,
  },
  INKSWELL: {
    id: 'INKSWELL_RITUAL',
    name: 'Inkswell Ritual',
    starter: false,
    poolFrequency: 4,
    cost: 1,
    exhaust: true,
    tags: ['generateInk'],
    effects: [{ kind: 'GAIN_INK', amount: 3 }],
  },
  CLOUDBUNNY: {
    id: 'CLOUDBUNNY',
    name: 'Cloudbunny',
    starter: false,
    poolFrequency: 4,
    cost: 0,
    tags: ['addBunnies'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 1 }],
  },
  HEALTH_POTION: {
    id: 'HEALTH_POTION',
    name: 'Health Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    unsocketable: true,
    tags: ['heal', 'consume'],
    effects: [{ kind: 'HEAL', amount: 10 }],
  },
  VOID_FOX: {
    id: 'VOID_FOX',
    name: 'Void Fox',
    starter: false,
    poolFrequency: 1,
    cost: 1,
    tags: ['consume'],
    effects: [{ kind: 'CONSUME_SELECTED_CARD', numberOfTargets: 1 }],
  },
  DEFEND: {
    id: 'DEFEND',
    name: 'Defend',
    starter: true,
    starterDeckNumber: 3,
    poolFrequency: 5,
    cost: 1,
    tags: ['addShield'],
    effects: [{ kind: 'GAIN_SHIELD', amount: 8 }],
  },
  SHIELD_POTION: {
    id: 'SHIELD_POTION',
    name: 'Shield Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    unsocketable: true,
    tags: ['addShield', 'consume'],
    upgradeMultiplier: 10,
    effects: [{ kind: 'GAIN_SHIELD', amount: 30 }],
  },
  FIREBALL: {
    id: 'FIREBALL',
    name: 'Fireball',
    starter: false,
    poolFrequency: 3,
    cost: 1,
    tags: ['damage', 'fire'],
    effects: [{ kind: 'DEAL_DAMAGE', amount: 10 }],
  },
  FORTRESS: {
    id: 'FORTRESS',
    name: 'Fortress',
    starter: false,
    poolFrequency: 3,
    cost: 0,
    tags: ['addShield', 'lockShield'],
    effects: [{ kind: 'GAIN_SHIELD', amount: 4 }, { kind: 'LOCK_ALL_SHIELD' }],
    upgradeMultiplier: 0.5,
  },
  FIREBALL_POTION: {
    id: 'FIREBALL_POTION',
    name: 'Fireball Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    unsocketable: true,
    tags: ['damage', 'fire', 'consume'],
    upgradeMultiplier: 5,
    effects: [{ kind: 'DEAL_DAMAGE', amount: 30 }],
  },
  SQUID_POTION: {
    id: 'SQUID_POTION',
    name: 'Squid Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    unsocketable: true,
    tags: ['generateInk', 'consume'],
    effects: [{ kind: 'GAIN_INK', amount: 2 }],
  },
  BUNNY_POTION: {
    id: 'BUNNY_POTION',
    name: 'Bunny Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    unsocketable: true,
    tags: ['addBunnies', 'consume'],
    upgradeMultiplier: 5,
    effects: [{ kind: 'ADD_BUNNIES', amount: 15 }],
  },
  WISDOM_POTION: {
    id: 'WISDOM_POTION',
    name: 'Wisdom Potion',
    starter: false,
    poolFrequency: 1,
    cost: 0,
    unsocketable: true,
    tags: ['upgrade', 'consume'],
    effects: [{ kind: 'UPGRADE_SELECTED_CARD', numberOfTargets: 1, upgradeAmount: 1 }],
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
    tags: ['burden', 'unplayable', 'consume'],
    effects: [{ kind: 'CONSUME_IF_IN_HAND_AT_TURN_END' }],
  },
}

export function cardTemplateById(templateId: CardId): CardTemplate | undefined {
  const direct = Cards[templateId]
  if (direct) return direct
  return Object.values(Cards).find((card) => card.id === templateId)
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
