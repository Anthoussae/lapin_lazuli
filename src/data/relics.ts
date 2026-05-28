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
    | 'card_played'
    | 'potion_played'
    | 'turn_end'
    | 'enemy_attack'
    | 'onPlayerUnblockedDamage'
    | 'onTotalAttackBlock'
    | 'enemy_defeated'
    | 'miniboss_defeated'
    | 'combat_end'
    | 'onRest'
    | 'onSleep'
    | 'onLevelUp'
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
  value: 'cardsPlayedThisTurn'
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
  /** Special render properties for this relic's icon (UI-only). */
  render?: RelicCounterRender
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
    text: "+150 gold.",
    triggers: [{ id: 'GOLD_INGOT_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_GOLD', amount: 150 } }],
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
    forceStartOffer: true,
    text: '50% poison resist. +50% poison damage.',
    triggers: [],
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
    text: 'The first time you take damage each combat, gain +3 shield power until end of combat.',
    triggers: [
      {
        id: 'POCKET_MOON_FIRST_DAMAGE',
        on: 'onPlayerUnblockedDamage',
        effect: { kind: 'GAIN_SHIELD_POWER', amount: 3, duration: 'combat' },
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
    text: 'At the start of combat, gain +1 all powers for each burden you bear until end of combat.',
    triggers: [
      {
        id: 'BACKPACK_COMBAT_START',
        on: 'combat_start',
        effect: { kind: 'GAIN_ALL_POWERS_PER_OWNED_BURDEN' },
        triggerFx: {},
      },
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
    text: 'Whenever you use a potion, heal 4 HP.',
    triggers: [
      {
        id: 'SPRIG_OF_WOLFSBANE_POTION_PLAYED',
        on: 'potion_played',
        effect: { kind: 'HEAL', amount: 4 },
        triggerFx: {},
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
