import type { RelicId } from '../core/types/ids'
import type { Effect } from './effects'
import type { TriggerFxDef } from './triggerFx'

export type { TriggerFxDef, TriggerFxTargetDef, TriggerFxTargetKind } from './triggerFx'

export type TriggerDef = Readonly<{
  id: string
  on:
    | 'onPickup'
    | 'draw_starting_hand'
    | 'onNonOpenerCardDraw'
    | 'combat_start'
    | 'turn_start'
    | 'fourthSpellCastPerTurn'
    | 'castSpellWithCostAboveAmount'
    | 'onCastNamedCard'
    | 'card_played'
    | 'potion_played'
    | 'turn_end'
    | 'enemy_attack'
    | 'onReceivingAttack'
    | 'onPlayerUnblockedDamage'
    | 'onTotalAttackBlock'
    | 'enemy_defeated'
    | 'miniboss_defeated'
    | 'combat_end'
    | 'onRest'
    | 'onSleep'
    | 'onLevelUp'
    | 'onAddCardToDeck'
    | 'onAddCardOfType'
    | 'onChoosingPath'
  /** When `on` is `onChoosingPath`, only fire for paths of this kind (combat includes minibosses and bosses). */
  choosingPathType?: 'combat'
  /** When `on` is `onAddCardOfType`, only fire when the added card's template includes this tag. */
  cardTag?: string
  /** When `on` is `castSpellWithCostAboveAmount`, minimum printed ink cost (inclusive). */
  amount?: number
  /** When `on` is `onCastNamedCard`, match {@link CardTemplate.name} (case- and space-insensitive). */
  cardName?: string
  effect: Effect
  /** Declarative trigger animation; source pulse is implicit when this is set. */
  triggerFx?: TriggerFxDef
}>

export type RelicCounterRender = Readonly<{
  kind: 'RelicCounter'
  /**
   * Counter position relative to the icon center (px).
   * Typical bottom-right might be something like { x: 18, y: 18 }.
   */
  offset: Readonly<{ x: number; y: number }>
  fontSize: number
  color: string
  value: 'cardsPlayedThisTurn' | 'backpackTurnCounter'
}>

export type RelicTemplate = Readonly<{
  id: RelicId
  name: string
  thumb: string
  text?: string
  starter: boolean
  /** If true, this relic is never offered again while the player already has a copy in their relic belt. */
  unique: boolean
  /** When true, never rolled into the shop relic row (treasure room, miniboss drafts, etc. are unaffected). */
  notOfferableByShop?: boolean
  /** When true, at least one copy is guaranteed in the starter relic offer row (for playtesting). */
  forceStartOffer?: boolean
  /** When true, the player begins a new run with this relic already on the belt (debug / playtesting). */
  forceStartInBelt?: boolean
  /** Special render properties for this relic's icon (UI-only). */
  render?: RelicCounterRender
  /** Optional: cadence for relics whose effects trigger every N player turns (persistent counters). */
  counterEveryTurns?: number
  triggers: ReadonlyArray<TriggerDef>
}>

export const Relics: Readonly<Record<RelicId, RelicTemplate>> = {
  KEYCHAIN: {
    id: 'KEYCHAIN',
    name: 'Keychain',
    thumb: 'K',
    starter: true,
    unique: true,
    text: "Gain 5 keys.",
    triggers: [{ id: 'KEYCHAIN_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_KEYS', amount: 5 } }],
  },
  ETERNAL_INKSTONE: {
    id: 'ETERNAL_INKSTONE',
    name: 'Eternal Inkstone',
    thumb: 'E',
    starter: true,
    unique: true,
    text: "+1 max ink.",
    triggers: [{ id: 'ETERNAL_INKSTONE_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_MAX_INK', amount: 1 } }],
  },
  HYDRANGEA: {
    id: 'HYDRANGEA',
    name: 'Hydrangea',
    thumb: 'H',
    starter: true,
    unique: true,
    text: "+25 max health.",
    triggers: [{ id: 'HYDRANGEA_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_MAX_HP', amount: 25 } }],
  },
  ARCANE_SCROLL: {
    id: 'ARCANE_SCROLL',
    name: 'Arcane Scroll',
    thumb: 'S',
    starter: true,
    unique: true,
    text: "+3 cards in each opening hand.",
    triggers: [
      {
        id: 'ARCANE_SCROLL_STARTING_HAND',
        on: 'draw_starting_hand',
        effect: { kind: 'DRAW_CARDS', amount: 3 },
        triggerFx: {},
      },
    ],
  },
  MAGIC_STAFF: {
    id: 'MAGIC_STAFF',
    name: 'Magic Staff',
    thumb: 'M',
    starter: true,
    unique: true,
    triggers: [
      {
        id: 'MAGIC_STAFF_TURN_START',
        on: 'turn_start',
        effect: { kind: 'ADD_BUNNIES', amount: 3 },
        triggerFx: { targets: [{ kind: 'cauldron', role: 'buff' }] },
      },
    ],
  },
  GOLD_INGOT: {
    id: 'GOLD_INGOT',
    name: 'Gold Ingot',
    thumb: 'G',
    starter: true,
    unique: true,
    notOfferableByShop: true,
    text: "+200 gold.",
    triggers: [{ id: 'GOLD_INGOT_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_GOLD', amount: 200 } }],
  },
  MAGIC_WAND: {
    id: 'MAGIC_WAND',
    name: 'Magic Wand',
    thumb: 'W',
    starter: true,
    unique: true,
    text: "+2 bunny power.",
    triggers: [{ id: 'MAGIC_WAND_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_POWER', amount: 2 } }],
  },
  RED_HAT: {
    id: 'RED_HAT',
    name: 'Red Hat',
    thumb: 'R',
    starter: true,
    unique: true,
    text: '+3 fire power.',
    triggers: [{ id: 'RED_HAT_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_FIREPOWER', amount: 3 } }],
  },
  GREEN_HAT: {
    id: 'GREEN_HAT',
    name: 'Green Hat',
    thumb: 'G',
    starter: true,
    unique: true,
    text: '+50% poison damage.',
    triggers: [],
  },
  PURPLE_HAT: {
    id: 'PURPLE_HAT',
    name: 'Purple Hat',
    thumb: 'P',
    starter: true,
    unique: true,
    text: 'Whenever you play a card, add 1 bunny.',
    triggers: [
      {
        id: 'PURPLE_HAT_CARD_PLAYED',
        on: 'card_played',
        effect: { kind: 'ADD_BUNNIES', amount: 1 },
        triggerFx: { targets: [{ kind: 'cauldron', role: 'buff' }] },
      },
    ],
  },
  PHOENIX_FEATHER_QUILL: {
    id: 'PHOENIX_FEATHER_QUILL',
    name: 'Phoenix-feather Quill',
    thumb: 'Q',
    starter: true,
    unique: true,
    text: 'The first fire spell you cast each combat costs 0 ink.',
    triggers: [
      {
        id: 'PHOENIX_FEATHER_QUILL_COMBAT_START',
        on: 'combat_start',
        effect: { kind: 'ACTIVATE_FREE_FIRST_FIRE_SPELL' },
      },
    ],
  },
  ENCHANTED_ENCYCLOPAEDIA: {
    id: 'ENCHANTED_ENCYCLOPAEDIA',
    name: 'Enchanted Encyclopaedia',
    thumb: 'E',
    starter: true,

    unique: true,
    text: '+1 hand size.',
    triggers: [
      {
        id: 'ENCHANTED_ENCYCLOPAEDIA_PICKUP',
        on: 'onPickup',
        effect: { kind: 'GAIN_HAND_SIZE', amount: 1 },
      },
    ],
  },
  NAZAR: {
    id: 'NAZAR',
    name: 'Nazar',
    thumb: 'N',
    starter: true,
    unique: true,
    triggers: [
      {
        id: 'NAZAR_COMBAT_START',
        on: 'combat_start',
        effect: { kind: 'GAIN_LOCKED_SHIELD', amount: 7 },
        triggerFx: { targets: [{ kind: 'playerLockedShield', role: 'buff' }] },
      },
    ],
  },
  LUCKY_EGG: {
    id: 'LUCKY_EGG',
    name: 'Lucky Egg',
    thumb: 'E',
    starter: true,
    unique: true,
    text: "+2 luck.",
    triggers: [{ id: 'LUCKY_EGG_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_LUCK', amount: 2 } }],
  },
  SHAKUJO: {
    id: 'SHAKUJO',
    name: 'Shakujō',
    thumb: 'S',
    starter: true,
    unique: true,
    text: '+2 shield power.',
    triggers: [{ id: 'SHAKUJO_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_SHIELD_POWER', amount: 2 } }],
  },
  MAGES_TOME: {
    id: 'MAGES_TOME',
    name: "Mage's Tome",
    thumb: 'T',
    starter: true,
    unique: true,
    text: 'Whenever you draw a card other than into your opening hand, add 1 bunny.',
    triggers: [
      {
        id: 'MAGES_TOME_NON_OPENER_DRAW',
        on: 'onNonOpenerCardDraw',
        effect: { kind: 'ADD_BUNNIES', amount: 1 },
        triggerFx: { targets: [{ kind: 'cauldron', role: 'buff' }] },
      },
    ],
  },
  MONOCLE: {
    id: 'MONOCLE',
    name: 'Monocle',
    thumb: 'M',
    starter: true,
    unique: true,
    text: 'Bunnymancies have a 20% critical chance.',
    triggers: [
      {
        id: 'MONOCLE_BUNNYMANCY_CRITICAL',
        on: 'onCastNamedCard',
        cardName: 'bunnymancy',
        effect: {
          kind: 'CRITICAL',
          chancePercent: 20,
          chanceUpgradeValue: 0,
          multiplierPercent: 200,
          multiplierUpgradeValue: 0,
        },
      },
    ],
  },
  HAND_OF_FATIMA: {
    id: 'HAND_OF_FATIMA',
    name: 'Hand of Fátima',
    thumb: 'H',
    starter: true,
    unique: true,
    text: 'Defends have a 20% critical chance.',
    triggers: [
      {
        id: 'HAND_OF_FATIMA_DEFEND_CRITICAL',
        on: 'onCastNamedCard',
        cardName: 'defend',
        effect: {
          kind: 'CRITICAL',
          chancePercent: 20,
          chanceUpgradeValue: 0,
          multiplierPercent: 200,
          multiplierUpgradeValue: 0,
        },
      },
    ],
  },
  PAPER_BOAT: {
    id: 'PAPER_BOAT',
    name: 'Paper Boat',
    thumb: 'P',
    starter: true,
    unique: true,
    text: 'At the start combat, gain shields equal to your level.',
    triggers: [
      {
        id: 'PAPER_BOAT_COMBAT_START',
        on: 'combat_start',
        effect: { kind: 'GAIN_SHIELD_EQUAL_TO_LEVEL' },
        triggerFx: { targets: [{ kind: 'playerShield', role: 'buff' }] },
      },
    ],
  },
  BANANA: {
    id: 'BANANA',
    name: 'Banana',
    thumb: 'b',
    starter: false,
    unique: false,
    text: "+5 max health.",
    triggers: [{ id: 'BANANA_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_MAX_HP', amount: 5 } }],
  },
  BUBBLE_WAND: {
    id: 'BUBBLE_WAND',
    name: 'Bubble Wand',
    thumb: 'B',
    starter: true,
    unique: true,
    text: 'Start each combat with a bubble.',
    triggers: [
      {
        id: 'BUBBLE_WAND_COMBAT_START',
        on: 'combat_start',
        effect: { kind: 'APPLY_ENCHANTMENT', enchantmentId: 'BUBBLE', target: 'self', amount: 1 },
        triggerFx: {},
      },
    ],
  },
  NURSES_HAT: {
    id: 'NURSES_HAT',
    name: "Nurse's Hat",
    thumb: 'N',
    starter: true,
    unique: true,
    text: 'At the end of each combat, heal 4 HP.',
    triggers: [
      {
        id: 'NURSES_HAT_COMBAT_END',
        on: 'combat_end',
        effect: { kind: 'HEAL', amount: 4 },
        triggerFx: {},
      },
    ],
  },
  POCKET_MOON: {
    id: 'POCKET_MOON',
    name: 'Pocket Moon',
    thumb: 'M',
    starter: true,
    unique: true,
    text: 'Start each combat with two anti-magic shells.',
    triggers: [
      {
        id: 'POCKET_MOON_COMBAT_START',
        on: 'combat_start',
        effect: { kind: 'APPLY_ENCHANTMENT', enchantmentId: 'ANTI_MAGIC_SHELL', target: 'self', amount: 2 },
        triggerFx: {},
      },
    ],
  },
  TAROT_DECK: {
    id: 'TAROT_DECK',
    name: 'Tarot Deck',
    thumb: 'T',
    starter: true,
    unique: true,
    text: 'On pickup, upgrade three random cards.',
    triggers: [
      {
        id: 'TAROT_DECK_PICKUP',
        on: 'onPickup',
        effect: { kind: 'UPGRADE_RANDOM_DECK_CARDS', numberOfTargets: 3, upgradeAmount: 1 },
      },
    ],
  },
  ORCHID: {
    id: 'ORCHID',
    name: 'Orchid',
    thumb: 'O',
    starter: true,
    unique: true,
    text: 'Whenever you defeat a miniboss, gain +7 max HP.',
    triggers: [
      {
        id: 'ORCHID_MINIBOSS_DEFEATED',
        on: 'miniboss_defeated',
        effect: { kind: 'GAIN_MAX_HP', amount: 7 },
        triggerFx: {},
      },
    ],
  },
  PAINTBRUSH: {
    id: 'PAINTBRUSH',
    name: 'Paintbrush',
    thumb: 'P',
    starter: true,
    unique: true,
    text: 'The fifth spell you cast each turn costs 0 ink.',
    render: {
      kind: 'RelicCounter',
      offset: { x: 18, y: 18 },
      fontSize: 14,
      color: '#ffffff',
      value: 'cardsPlayedThisTurn',
    },
    triggers: [
      {
        id: 'PAINTBRUSH_FOURTH_SPELL_CAST',
        on: 'fourthSpellCastPerTurn',
        effect: { kind: 'NEXT_SPELL_COSTS_0' },
        triggerFx: {},
      },
    ],
  },
  // may have bugs; check before release.
  BACKPACK: {
    id: 'BACKPACK',
    name: 'Backpack',
    thumb: 'B',
    starter: true,
    unique: true,
    text: 'Every 3 turns, gain 1 shield for each card in your deck.',
    counterEveryTurns: 4,
    render: {
      kind: 'RelicCounter',
      offset: { x: 21, y: 21 },
      fontSize: 14,
      color: '#ffffff',
      value: 'backpackTurnCounter',
    },
    triggers: [
      // Trigger is handled specially in `applyTurnStartRelicTriggers` because it uses a persistent counter.
    ],
  },
  RYO: {
    id: 'RYO',
    name: 'Ryō',
    thumb: '¥',
    starter: true,
    unique: true,
    text: 'Gain 7% gold interest per level.',
    triggers: [
      {
        id: 'RYO_LEVEL_UP',
        on: 'onLevelUp',
        effect: { kind: 'GAIN_INTEREST', percentAmount: 7 },
        triggerFx: {},
      },
    ],
  },
  WOODEN_SHIELD: {
    id: 'WOODEN_SHIELD',
    name: 'Wooden Shield',
    thumb: 'W',
    starter: true,
    unique: true,
    text: "Whenever you completely block an enemy's attack, gain 5 bunnies.",
    triggers: [
      {
        id: 'WOODEN_SHIELD_TOTAL_BLOCK',
        on: 'onTotalAttackBlock',
        effect: { kind: 'ADD_BUNNIES', amount: 5 },
        triggerFx: { targets: [{ kind: 'cauldron', role: 'buff' }] },
      },
    ],
  },
  COPPER_ALEMBICS: {
    id: 'COPPER_ALEMBICS',
    name: 'Copper Alembics',
    thumb: 'C',
    starter: true,
    unique: true,
    text: 'At the start of each combat, add a random potion to your hand. It gains Expire.',
    triggers: [
      {
        id: 'COPPER_ALEMBICS_COMBAT_START',
        on: 'combat_start',
        effect: { kind: 'ADD_RANDOM_POTION_TO_HAND' },
        triggerFx: {},
      },
    ],
  },
  SPRIG_OF_WOLFSBANE: {
    id: 'SPRIG_OF_WOLFSBANE',
    name: 'Sprig of Wolfsbane',
    thumb: 'w',
    starter: true,
    unique: true,
    text: 'Whenever you drink a potion, gain +4 max HP.',
    triggers: [
      {
        id: 'SPRIG_OF_WOLFSBANE_POTION_PLAYED',
        on: 'potion_played',
        effect: { kind: 'GAIN_MAX_HP', amount: 4 },
        triggerFx: {},
      },
    ],
  },
  GLADIATOR_HELMET: {
    id: 'GLADIATOR_HELMET',
    name: "Gladiator's Helmet",
    thumb: 'G',
    starter: true,
    unique: true,
    text: 'Whenever you choose a combat path, gain 15 gold.',
    triggers: [
      {
        id: 'GLADIATOR_HELMET_CHOOSING_COMBAT_PATH',
        on: 'onChoosingPath',
        choosingPathType: 'combat',
        effect: { kind: 'GAIN_GOLD', amount: 15 },
        triggerFx: {},
      },
    ],
  },
  BLUE_ROSE: {
    id: 'BLUE_ROSE',
    name: 'Blue Rose',
    thumb: 'B',
    starter: true,
    unique: true,
    text: 'Whenever you add a card to your deck, gain +2 Max HP.',
    triggers: [
      {
        id: 'BLUE_ROSE_ADD_CARD_TO_DECK',
        on: 'onAddCardToDeck',
        effect: { kind: 'GAIN_MAX_HP', amount: 2 },
        triggerFx: {},
      },
    ],
  },
  PET_ROCK: {
    id: 'PET_ROCK',
    name: 'Pet Rock',
    thumb: 'P',
    starter: true,
    unique: true,
    text: 'Whenever you cast a spell that costs 2 or more ink, gain 6 shields.',
    triggers: [
      {
        id: 'PET_ROCK_CAST_SPELL_2_PLUS_INK',
        on: 'castSpellWithCostAboveAmount',
        amount: 2,
        effect: { kind: 'GAIN_SHIELD', amount: 6 },
        triggerFx: { targets: [{ kind: 'playerShield', role: 'buff' }] },
      },
    ],
  },
  EMBERS: {
    id: 'EMBERS',
    name: 'Embers',
    thumb: 'E',
    starter: true,
    unique: true,
    text: 'Whenever you add a fire card to your deck, upgrade it.',
    triggers: [
      {
        id: 'EMBERS_ADD_FIRE_CARD',
        on: 'onAddCardOfType',
        cardTag: 'fire',
        effect: { kind: 'UPGRADE_ADDED_CARD', upgradeAmount: 1 },
        triggerFx: {},
      },
    ],
  },
  PEACOCK_FEATHER: {
    id: 'PEACOCK_FEATHER',
    name: 'Peacock Feather',
    thumb: 'P',
    starter: true,
    unique: true,
    text: '10% chance to dodge incoming attacks.',
    triggers: [
      {
        id: 'PEACOCK_FEATHER_DODGE',
        on: 'onReceivingAttack',
        effect: { kind: 'DODGE', chance: 0.1 },
      },
    ],
  },
  HOURGLASS: {
    id: 'HOURGLASS',
    name: 'Hourglass',
    thumb: 'H',
    starter: false,
    unique: true,
    text: 'Upon pickup, reduce your level by 4 (minimum 0).',
    triggers: [
      {
        id: 'HOURGLASS_PICKUP',
        on: 'onPickup',
        effect: { kind: 'MODIFY_GAME_LEVEL', amount: -5, min: 0 },
      },
    ],
  },
}

export const StarterRelicPool: ReadonlyArray<RelicId> = (Object.keys(Relics) as RelicId[])
  .filter((id) => Relics[id]?.starter)
  .sort()

export function isRelicOfferable(relicId: RelicId, ownedTemplateIds: ReadonlySet<RelicId>): boolean {
  const t = Relics[relicId]
  if (!t) return false
  if (t.unique && ownedTemplateIds.has(relicId)) return false
  return true
}

/** Relic ids that may appear in shops, rewards, etc., given what the player already has. */
export function offerableRelicIds(ownedTemplateIds: ReadonlySet<RelicId>): RelicId[] {
  return (Object.keys(Relics) as RelicId[]).filter((id) => isRelicOfferable(id, ownedTemplateIds))
}

/** Subset of {@link offerableRelicIds} allowed in the shop's three relic slots (excludes `notOfferableByShop`). */
export function shopOfferableRelicIds(ownedTemplateIds: ReadonlySet<RelicId>): RelicId[] {
  return offerableRelicIds(ownedTemplateIds).filter((id) => !Relics[id]?.notOfferableByShop)
}
