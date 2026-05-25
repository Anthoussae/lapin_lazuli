import type { CardId } from '../../core/types/ids'
import bunnymancy from '../../assets/images/cardillustrations/bunnymancy.png'
import cloudBunny from '../../assets/images/cardillustrations/cloudBunny.png'
import clutter from '../../assets/images/cardillustrations/clutter.png'
import defend from '../../assets/images/cardillustrations/defend.png'
import dodge from '../../assets/images/cardillustrations/dodge.png'
import fireball from '../../assets/images/cardillustrations/fireball.png'
import firePotion from '../../assets/images/cardillustrations/firePotion.png'
import fortress from '../../assets/images/cardillustrations/fortress.png'
import healthpotion from '../../assets/images/cardillustrations/healthpotion.png'
import inkpotion from '../../assets/images/cardillustrations/inkpotion.png'
import inkswell from '../../assets/images/cardillustrations/inkswell.png'
import leadIngot from '../../assets/images/cardillustrations/leadIngot.png'
import multibunnies from '../../assets/images/cardillustrations/multibunnies.png'
import placeholderPotion from '../../assets/images/cardillustrations/placeholderPotion.png'
import ponder from '../../assets/images/cardillustrations/ponder.png'
import practice from '../../assets/images/cardillustrations/practice.png'
import smoke from '../../assets/images/cardillustrations/smoke.png'
import letheanWater from '../../assets/images/potions/letheanWater.png'
import wiseBunny from '../../assets/images/cardillustrations/wiseBunny.png'
import wisdomPotion from '../../assets/images/cardillustrations/wisdomPotion.png'
import cardIllustrationPlaceholder from '../../assets/images/displayElements/inkdrop.png'

/** Card illustration art keyed by {@link CardId}. */
export const CARD_ILLUSTRATIONS_BY_ID: Readonly<Partial<Record<CardId, string>>> = Object.freeze({
  BUNNYMANCY: bunnymancy,
  MULTIBUNNIES: multibunnies,
  PRACTICE: practice,
  PONDER: ponder,
  DODGE: dodge,
  WISE_BUNNIES: wiseBunny,
  INKSWELL_RITUAL: inkswell,
  CLOUDBUNNY: cloudBunny,
  HEALTH_POTION: healthpotion,
  LETHEAN_WATER: letheanWater,
  DEFEND: defend,
  SHIELD_POTION: placeholderPotion,
  FIREBALL: fireball,
  FORTRESS: fortress,
  FIREBALL_POTION: firePotion,
  SQUID_POTION: inkpotion,
  BUNNY_POTION: placeholderPotion,
  WISDOM_POTION: wisdomPotion,
  LEAD_INGOT: leadIngot,
  CLUTTER: clutter,
  SMOKE: smoke,
})

export function cardIllustrationForId(cardId: CardId): string {
  return CARD_ILLUSTRATIONS_BY_ID[cardId] ?? cardIllustrationPlaceholder
}

export const CARD_ILLUSTRATION_PRELOAD_URLS: readonly string[] = [
  ...Object.values(CARD_ILLUSTRATIONS_BY_ID).filter((url): url is string => url != null),
  cardIllustrationPlaceholder,
]
