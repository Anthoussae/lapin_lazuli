import type { RelicId } from '../core/types/ids'
import type { Effect } from './effects'
import type { TriggerFxDef } from './triggerFx'

export type { TriggerFxDef, TriggerFxTargetDef, TriggerFxTargetKind } from './triggerFx'

export type TriggerDef = Readonly<{
  id: string
  on:
    | 'onPickup'
    | 'draw_starting_hand'
    | 'combat_start'
    | 'turn_start'
    | 'card_played'
    | 'turn_end'
    | 'enemy_attack'
    | 'enemy_defeated'
    | 'onRest'
    | 'onSleep'
  effect: Effect
  /** Declarative trigger animation; source pulse is implicit when this is set. */
  triggerFx?: TriggerFxDef
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
    text: "+2 cards in each opening hand.",
    triggers: [
      {
        id: 'ARCANE_SCROLL_STARTING_HAND',
        on: 'draw_starting_hand',
        effect: { kind: 'DRAW_CARDS', amount: 2 },
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
    text: "+1 bunny power.",
    triggers: [{ id: 'MAGIC_WAND_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_POWER', amount: 1 } }],
  },
  ENCHANTED_ENCYCLOPAEDIA: {
    id: 'ENCHANTED_ENCYCLOPAEDIA',
    name: 'Enchanted Encyclopaedia',
    thumb: 'E',
    starter: true,
    unique: true,
    text: "Upgrade your Multibunnies twice.",
    triggers: [
      {
        id: 'ENCHANTED_ENCYCLOPAEDIA_PICKUP',
        on: 'onPickup',
        effect: { kind: 'UPGRADE_SPECIFIC_CARD', target: 'MULTIBUNNIES', numberOfTargets: 1, upgradeAmount: 2 },
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
    name: 'Shakujo',
    thumb: 'S',
    text: "Double all fire damage.",
    starter: true,
    unique: true,
    triggers: [
      { id: 'SHAKUJO_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_FIREPOWER_MULTIPLIER', amount: 2 } },
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
