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
import bunnyPotion from '../../assets/images/cardillustrations/bunnyPotion.png'
import shieldPotion from '../../assets/images/cardillustrations/shieldPotion.png'
import ponder from '../../assets/images/cardillustrations/ponder.png'
import practice from '../../assets/images/cardillustrations/practice.png'
import smoke from '../../assets/images/cardillustrations/smoke.png'
import stoneskin from '../../assets/images/cardillustrations/stoneskin.png'
import poison from '../../assets/images/cardillustrations/poison.png'
import dispel from '../../assets/images/cardillustrations/dispel.png'
import smog from '../../assets/images/cardillustrations/smog.png'
import conflagration from '../../assets/images/cardillustrations/conflagration.png'
import crownOfFlames from '../../assets/images/cardillustrations/crownOfFlames.png'
import guardianAngel from '../../assets/images/cardillustrations/guardianAngel.png'
import hareRaising from '../../assets/images/cardillustrations/hareRaising.png'
import warm from '../../assets/images/cardillustrations/warm.png'
import letheanWater from '../../assets/images/potions/letheanWater.png'
import wiseBunny from '../../assets/images/cardillustrations/wiseBunny.png'
import wisdomPotion from '../../assets/images/cardillustrations/wisdomPotion.png'
import cloverJuice from '../../assets/images/cardillustrations/cloverJuice.png'
import bananaJuice from '../../assets/images/cardillustrations/bananaJuice.png'
import carrotCake from '../../assets/images/cardillustrations/carrotCake.png'
import willowTea from '../../assets/images/cardillustrations/willowTea.png'
import bubbleMix from '../../assets/images/cardillustrations/bubbleMix.png'
import blowingBubbles from '../../assets/images/cardillustrations/blowingBubbles.png'
import bunnySummons from '../../assets/images/cardillustrations/bunnySummons.png'
import flameSlash from '../../assets/images/cardillustrations/flameSlash.png'
import shatteringBlast from '../../assets/images/cardillustrations/shatter.png'
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
  SHIELD_POTION: shieldPotion,
  FIREBALL: fireball,
  FORTRESS: fortress,
  FIREBALL_POTION: firePotion,
  SQUID_POTION: inkpotion,
  BUNNY_POTION: bunnyPotion,
  WISDOM_POTION: wisdomPotion,
  CLOVER_JUICE: cloverJuice,
  BANANA_JUICE: bananaJuice,
  CARROT_CAKE: carrotCake,
  WILLOWBARK_TEA: willowTea,
  BUBBLE_MIX: bubbleMix,
  ANTI_MAGIC_SHELL: blowingBubbles,
  LEAD_INGOT: leadIngot,
  CLUTTER: clutter,
  SMOKE: smoke,
  STONESKIN: stoneskin,
  POISON: poison,
  CROWN_OF_FLAMES: crownOfFlames,
  CONFLAGRATION: conflagration,
  GUARDIAN_ANGEL: guardianAngel,
  HARE_RAISING: hareRaising,
  WARM: warm,
  SMOG: smog,
  DISPEL: dispel,
  BUNNY_SUMMONS: bunnySummons,
  FLAME_SLASH: flameSlash,
  SHATTERING_BLAST: shatteringBlast,
})

export function cardIllustrationForId(cardId: CardId): string {
  return CARD_ILLUSTRATIONS_BY_ID[cardId] ?? cardIllustrationPlaceholder
}

export const CARD_ILLUSTRATION_PRELOAD_URLS: readonly string[] = [
  ...Object.values(CARD_ILLUSTRATIONS_BY_ID).filter((url): url is string => url != null),
  cardIllustrationPlaceholder,
]
