import type { RelicId } from '../core/types/ids'
import type { Effect } from './effects'

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
  effect: Effect
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
  INKPOT: {
    id: 'INKPOT',
    name: 'Inkpot',
    thumb: 'I',
    starter: true,
    unique: true,
    triggers: [{ id: 'INKPOT_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_MAX_INK', amount: 1 } }],
  },
  HEART: {
    id: 'HEART',
    name: 'Heart',
    thumb: 'H',
    starter: true,
    unique: true,
    triggers: [{ id: 'HEART_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_MAX_HP', amount: 25 } }],
  },
  SCROLL: {
    id: 'SCROLL',
    name: 'Scroll',
    thumb: 'S',
    starter: true,
    unique: true,
    triggers: [{ id: 'SCROLL_STARTING_HAND', on: 'draw_starting_hand', effect: { kind: 'DRAW_CARDS', amount: 2 } }],
  },
  FLASK: {
    id: 'FLASK',
    name: 'Flask',
    thumb: 'F',
    starter: true,
    unique: true,
    triggers: [{ id: 'FLASK_TURN_START', on: 'turn_start', effect: { kind: 'ADD_BUNNIES', amount: 3 } }],
  },
  GOLD_COIN: {
    id: 'GOLD_COIN',
    name: 'Gold Coin',
    thumb: 'G',
    starter: true,
    unique: true,
    notOfferableByShop: true,
    triggers: [{ id: 'GOLD_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_GOLD', amount: 150 } }],
  },
  WAND: {
    id: 'WAND',
    name: 'Wand',
    thumb: 'W',
    starter: true,
    unique: true,
    triggers: [{ id: 'WAND_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_POWER', amount: 1 } }],
  },
  BOOK: {
    id: 'BOOK',
    name: 'Book',
    thumb: 'B',
    starter: true,
    unique: true,
    triggers: [
      {
        id: 'BOOK_PICKUP',
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
    triggers: [{ id: 'NAZAR_COMBAT_START', on: 'combat_start', effect: { kind: 'GAIN_LOCKED_SHIELD', amount: 7 } }],
  },
  LUCKY_CLOVER: {
    id: 'LUCKY_CLOVER',
    name: 'Lucky Clover',
    thumb: 'C',
    starter: true,
    unique: true,
    triggers: [{ id: 'LUCKY_CLOVER_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_LUCK', amount: 2 } }],
  },
  GARNET_TIARA: {
    id: 'GARNET_TIARA',
    name: 'Garnet Tiara',
    thumb: 'T',
    starter: true,
    unique: true,
    triggers: [
      { id: 'GARNET_TIARA_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_FIREPOWER_MULTIPLIER', amount: 2 } },
    ],
  },
  BANANA: {
    id: 'BANANA',
    name: 'Banana',
    thumb: 'b',
    starter: false,
    unique: false,
    triggers: [{ id: 'BANANA_PICKUP', on: 'onPickup', effect: { kind: 'GAIN_MAX_HP', amount: 5 } }],
  },
}

export const StarterRelicPool: ReadonlyArray<RelicId> = Object.keys(Relics)
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

