import type { CardId, CardInstanceId, GemId } from '../core/types/ids'
import type { CardInstance } from '../core/types/state'
import type { Effect } from './effects'
import { mkCardInstance, type MkCardInstanceOpts } from '../systems/factories'

export type CardTemplate = Readonly<{
  id: CardId
  name: string
  /** When true, included in the opening deck (see `starterDeckNumber`). */
  starter?: boolean
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
  /** Bugtesting: extra upgrade tiers applied whenever an instance of this card is created. */
  forceUpgrade?: number
  /** Bugtesting: socket each new instance with this gem (same flags as Gemstone Cavern confirm). */
  forceSocketedByGemId?: GemId
}>

export const Cards: Readonly<Record<CardId, CardTemplate>> = {
  BUNNYMANCY: {
    id: 'BUNNYMANCY',
    name: 'Bunnymancy',
    starter: true,
    starterDeckNumber: 4,
    poolFrequency: 4,
    cost: 1,
    tags: ['addBunnies'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 6, upgradeValue: 3 }],
  },
  MULTIBUNNIES: {
    id: 'MULTIBUNNIES',
    name: 'Multibunnies',
    poolFrequency: 1,
    cost: 2,
    tags: ['multBunnies'],
    effects: [{ kind: 'MULTIPLY_BUNNIES', amount: 2, upgradeValue: 0.25 }],
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
    unupgradeable: true,
    tags: ['upgrade'],
    effects: [
      { kind: 'UPGRADE_SELECTED_CARD', numberOfTargets: 1, upgradeAmount: 1, upgradeValue: 1 },
      { kind: 'DESTINY', upgradeValue: 1 },
    ],
  },
  PONDER: {
    id: 'PONDER',
    name: 'Ponder',
    poolFrequency: 3,
    cost: 1,
    tags: ['drawcards'],
    effects: [{ kind: 'DRAW_CARDS', amount: 2, upgradeValue: 1 }],
  },
  DODGE: {
    id: 'DODGE',
    name: 'Dodge',
    poolFrequency: 3,
    cost: 1,
    tags: ['addShield', 'drawcards'],
    effects: [
      { kind: 'GAIN_SHIELD', amount: 4, upgradeValue: 3 },
      { kind: 'DRAW_CARDS', amount: 1, upgradeValue: 1 },
    ],
  },
  WISE_BUNNIES: {
    id: 'WISE_BUNNIES',
    name: 'Wise Bunnies',
    poolFrequency: 3,
    cost: 1,
    tags: ['drawcards', 'addBunnies'],
    effects: [
      { kind: 'ADD_BUNNIES', amount: 4, upgradeValue: 2 },
      { kind: 'DRAW_CARDS', amount: 1, upgradeValue: 1 },
    ],
  },
  INKSWELL: {
    id: 'INKSWELL_RITUAL',
    name: 'Inkswell Ritual',
    poolFrequency: 3,
    cost: 1,
    exhaust: true,
    tags: ['generateInk'],
    effects: [{ kind: 'GAIN_INK', amount: 2, upgradeValue: 1 }],
  },
  CLOUDBUNNY: {
    id: 'CLOUDBUNNY',
    name: 'Cloudbunny',
    poolFrequency: 3,
    cost: 0,
    exhaust: false,
    tags: ['addBunnies'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 3, upgradeValue: 2 }],
  },
  HEALTH_POTION: {
    id: 'HEALTH_POTION',
    name: 'Health Potion',
    
    poolFrequency: 2,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['heal', 'consume'],
    effects: [{ kind: 'HEAL', amount: 10, upgradeValue: 10 }],
  },
  LETHEAN_WATER: {
    id: 'LETHEAN_WATER',
    name: 'Lethean Water',
    poolFrequency: 2,
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
    poolFrequency: 4,
    cost: 1,
    tags: ['addShield'],
    effects: [{ kind: 'GAIN_SHIELD', amount: 6, upgradeValue: 3 }],
  },
  SHIELD_POTION: {
    id: 'SHIELD_POTION',
    name: 'Shield Potion',
    poolFrequency: 2,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['addShield', 'consume'],
    effects: [{ kind: 'GAIN_SHIELD', amount: 30, upgradeValue: 30 }],
  },
  FIREBALL: {
    id: 'FIREBALL',
    name: 'Fireball',
    poolFrequency: 3,
    cost: 1,
    tags: ['damage', 'fire'],
    effects: [{ kind: 'DEAL_DAMAGE', amount: 10, upgradeValue: 5 }],
  },
  FORTRESS: {
    id: 'FORTRESS',
    name: 'Fortress',
    poolFrequency: 3,
    cost: 0,
    tags: ['addShield', 'lockShield'],
    effects: [
      { kind: 'GAIN_SHIELD', amount: 4, upgradeValue: 2 },
      { kind: 'LOCK_ALL_SHIELD' },
    ],
  },
  FIREBALL_POTION: {
    id: 'FIREBALL_POTION',
    name: 'Fireball Potion',
    poolFrequency: 2,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['damage', 'fire', 'consume'],
    effects: [{ kind: 'DEAL_DAMAGE', amount: 30, upgradeValue: 30 }],
  },
  SQUID_POTION: {
    id: 'SQUID_POTION',
    name: 'Squid Potion',
    poolFrequency: 2,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['generateInk', 'consume'],
    effects: [{ kind: 'GAIN_INK', amount: 2, upgradeValue: 1 }],
  },
  BUNNY_POTION: {
    id: 'BUNNY_POTION',
    name: 'Bunny Potion',
    poolFrequency: 2,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['addBunnies', 'consume'],
    effects: [{ kind: 'ADD_BUNNIES', amount: 20, upgradeValue: 10 }],
  },
  WISDOM_POTION: {
    id: 'WISDOM_POTION',
    name: 'Wisdom Potion',
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['upgrade', 'consume'],
    effects: [{ kind: 'UPGRADE_SELECTED_CARD', numberOfTargets: 1, upgradeAmount: 1, upgradeValue: 1 }],
  },
  CLOVER_JUICE: {
    id: 'CLOVER_JUICE',
    name: 'Clover Juice',
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['consume'],
    effects: [{ kind: 'GAIN_LUCK', amount: 1, upgradeValue: 1 }],
  },
  BANANA_JUICE: {
    id: 'BANANA_JUICE',
    name: 'Banana Juice',
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['consume'],
    effects: [{ kind: 'GAIN_MAX_HP', amount: 5, upgradeValue: 5 }],
  },
  CARROT_CAKE: {
    id: 'CARROT_CAKE',
    name: 'Carrot Cake',
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['consume'],
    effects: [{ kind: 'GAIN_POWER', amount: 1, upgradeValue: 1 }],
  },
  WILLOWBARK_TEA: {
    id: 'WILLOWBARK_TEA',
    name: 'Willowbark Tea',
    poolFrequency: 1,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['consume'],
    effects: [{ kind: 'GAIN_SHIELD_POWER', amount: 1, upgradeValue: 1 }],
  },
  BUBBLE_MIX: {
    id: 'BUBBLE_MIX',
    name: 'Bubble Mix',
    poolFrequency: 2,
    cost: 0,
    potion: true,
    unsocketable: true,
    tags: ['consume'],
    effects: [{ kind: 'APPLY_ENCHANTMENT', enchantmentId: 'BUBBLE', target: 'self', amount: 1, upgradeValue: 1 }],
  },
  /** Burden: bad card; `poolFrequency: 0` — never drafted; only granted by effects. */
  LEAD_INGOT: {
    id: 'LEAD_INGOT',
    name: 'Lead ingot',
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
    poolFrequency: 2,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [{ kind: 'APPLY_ENCHANTMENT', enchantmentId: 'STONESKIN', target: 'self', amount: 1, upgradeValue: 1 }],
  },
  ANTI_MAGIC_SHELL: {
    id: 'ANTI_MAGIC_SHELL',
    name: 'Anti-Magic Shell',
    
    poolFrequency: 2,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [
      {
        kind: 'APPLY_ENCHANTMENT',
        enchantmentId: 'ANTI_MAGIC_SHELL',
        target: 'self',
        amount: 1,
        upgradeValue: 1,
      },
    ],
  },
  HARE_RAISING: {
    id: 'HARE_RAISING',
    name: 'Hare-raising',
    poolFrequency: 2,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [
      { kind: 'APPLY_ENCHANTMENT', enchantmentId: 'HARE_RAISING', target: 'self', amount: 1, upgradeValue: 1 },
    ],
  },
  BUNNYFORM: {
    id: 'BUNNYFORM',
    name: 'Bunnyform',
    poolFrequency: 2,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [
      { kind: 'APPLY_ENCHANTMENT', enchantmentId: 'BUNNYFORM', target: 'self', amount: 1, upgradeValue: 1 },
    ],
  },
  WARM: {
    id: 'WARM',
    name: 'Warm',
    poolFrequency: 2,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment', 'fire'],
    effects: [{ kind: 'APPLY_ENCHANTMENT', enchantmentId: 'WARM', target: 'self', amount: 1, upgradeValue: 1 }],
  },
  POISON: {
    id: 'POISON',
    name: 'Poison',
    starter: false,
    poolFrequency: 2,
    cost: 1,
    unsocketable: true,
    tags: ['enchantment'],
    effects: [{ kind: 'APPLY_ENCHANTMENT', enchantmentId: 'POISON', target: 'opponent', amount: 4, upgradeValue: 2 }],
  },
  CROWN_OF_FLAMES: {
    id: 'CROWN_OF_FLAMES',
    name: 'Crown of Flames',

    poolFrequency: 2,
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
    poolFrequency: 2,
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
    poolFrequency: 3,
    cost: 4,
    tags: ['damage', 'fire'],
    effects: [{ kind: 'DEAL_DAMAGE', amount: 50, upgradeValue: 15 }],
  },
  SHATTERING_BLAST: {
    id: 'SHATTERING_BLAST',
    name: 'Shattering Blast',
    poolFrequency: 3,
    cost: 1,
    unsocketable: false,
    tags: ['damage', 'fire'],
    effects: [
      { kind: 'SHATTER' },
      { kind: 'DEAL_DAMAGE', amount: 6, upgradeValue: 4 },
    ],
  },
  FLAME_SLASH: {
    id: 'FLAME_SLASH',
    name: 'Flame Slash',
    poolFrequency: 3,

    cost: 2,
    tags: ['damage', 'fire', 'critical'],
    effects: [
      {
        kind: 'CRITICAL',
        chancePercent: 20,
        chanceUpgradeValue: 5,
        multiplierPercent: 150,
        multiplierUpgradeValue: 25,
      },
      { kind: 'DEAL_DAMAGE', amount: 12, upgradeValue: 4 },
    ],
  },
  SMOG: {
    id: 'SMOG',
    name: 'Smog',
    starter: false,
    poolFrequency: 3,
    cost: 2,
    tags: ['poison', 'piercing'],
    effects: [{ kind: 'HP_LOSS', target: 'selectedEnemy', amount: 14, upgradeValue: 7 }],
  },
  DISPEL: {
    id: 'DISPEL',
    name: 'Dispel',
    poolFrequency: 3,
    cost: 0,
    tags: ['dispel'],
    effects: [{ kind: 'DISPEL', amount: 1, upgradeValue: 1 }],
  },
  BUNNY_SUMMONS: {
    id: 'BUNNY_SUMMONS',
    name: 'Bunny Summons',
    poolFrequency: 3,
    cost: 3,
    tags: ['addBunnies'],
    effects: [
      {
        kind: 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL',
        multiplier: 1,
        multiplierUpgradePerLevel: 0.5,
      },
    ],
  },
}

export function cardTemplateById(templateId: CardId): CardTemplate | undefined {
  const direct = Cards[templateId]
  if (direct) return direct
  return Object.values(Cards).find((card) => card.id === templateId)
}

/** Creates a deck card instance, applying template `forceUpgrade` / `forceSocketedByGemId`. */
export function createCardInstance(
  id: CardInstanceId,
  templateId: CardId,
  upgrades = 0,
  foil = false,
  opts?: MkCardInstanceOpts,
): CardInstance {
  const t = cardTemplateById(templateId)
  const totalUpgrades = upgrades + (t?.forceUpgrade ?? 0)
  let inst = mkCardInstance(id, templateId, totalUpgrades, foil, opts)
  const forceGem = t?.forceSocketedByGemId
  if (forceGem) {
    inst = { ...inst, socketedGemId: forceGem, unsocketable: true, unupgradable: true }
  }
  return inst
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
      instances.push(createCardInstance(`sd${serial++}` as CardInstanceId, id))
    }
  }
  const cardById: Record<CardInstanceId, CardInstance> = Object.fromEntries(instances.map((c) => [c.id, c]))
  const drawPile: CardInstanceId[] = instances.map((c) => c.id)
  return { cardById, drawPile }
}
