import mapBackground from '../../assets/images/displayElements/mapBackground.png'
import openDoor from '../../assets/images/displayElements/openDoor.png'
import deckInspectSprite from '../../assets/images/displayElements/deck.png'
import discardInspectSprite from '../../assets/images/displayElements/discarded cards.png'
import discardInspectSpriteFull from '../../assets/images/displayElements/discarded cards full.png'
import coin1Sprite from '../../assets/images/displayElements/coin1.png'
import coin2Sprite from '../../assets/images/displayElements/coin2.png'
import goldBagSprite from '../../assets/images/displayElements/GoldBag.png'
import keySprite from '../../assets/images/displayElements/key.png'
import pathDoorLockSprite from '../../assets/images/displayElements/lock.png'
import senjafudaFrame from '../../assets/images/displayElements/senjafudaFrame.png'
import tallscroll from '../../assets/images/displayElements/tallscroll.png'
import bunnyIrisOutline from '../../assets/images/displayElements/bunnyIrisOutline.png'
import blueCarpet from '../../assets/images/displayElements/blueCarpet.png'
import blackCarpet from '../../assets/images/displayElements/blackCarpet.png'
import blackCarpet2 from '../../assets/images/displayElements/blackCarpet2.png'
import greenCarpet from '../../assets/images/displayElements/greenCarpet.png'
import mythicCarpet from '../../assets/images/displayElements/mythicCarpet.png'
import leatherCarpet from '../../assets/images/displayElements/leatherCarpet.png'
import collectorSprite from '../../assets/images/displayElements/collector.png'
import speechBubbleRightSprite from '../../assets/images/displayElements/speechBubbleRight.png'
import fontOfLetheEmpty from '../../assets/images/displayElements/fontOfLetheEmpty.png'
import fontOfLetheFull from '../../assets/images/displayElements/fontOfLetheFull.png'
import printerSprite from '../../assets/images/displayElements/printer.png'
import leapingBunnyBack from '../../assets/images/displayElements/leapingBunnyBack.png'
import leapingBunnyFront from '../../assets/images/displayElements/leapingBunnyFront.png'
import tinyBunny from '../../assets/images/displayElements/tinyBunny.png'
import tinypoof from '../../assets/images/displayElements/tinypoof.png'
import poof from '../../assets/images/displayElements/poof.png'
import bigPoof from '../../assets/images/displayElements/bigPoof.png'
import castStar from '../../assets/images/displayElements/castStar.png'
import spark1Sprite from '../../assets/images/displayElements/spark1.png'
import spark2Sprite from '../../assets/images/displayElements/spark2.png'
import consumeCardAftermath from '../../assets/images/displayElements/consumeCardAftermath.png'
import xtoCloseIcon from '../../assets/images/displayElements/xtoCloseIcon.png'
import cauldronSprite from '../../assets/images/displayElements/cauldron.png'
import longbeltSprite from '../../assets/images/displayElements/longbelt.png'
import shopShelvesSprite from '../../assets/images/displayElements/shopShelves.png'
import restingSprite from '../../assets/images/displayElements/resting.png'
import sleepIllustrationSprite from '../../assets/images/displayElements/sleepIllustration.png'
import studyIllustrationSprite from '../../assets/images/displayElements/studyIllustration.png'
import playerPlaceholderSprite from '../../assets/images/displayElements/playerPlaceholder1.png'
import shieldSprite from '../../assets/images/displayElements/shield.png'
import brokenShieldSprite from '../../assets/images/displayElements/brokenShield.png'
import lockedShieldSprite from '../../assets/images/displayElements/buffedShield2.png'
import inkJarEmpty from '../../assets/images/displayElements/inkjars/emptyInk.png'
import inkJar1 from '../../assets/images/displayElements/inkjars/1Ink.png'
import inkJar2 from '../../assets/images/displayElements/inkjars/2Ink.png'
import inkJar3 from '../../assets/images/displayElements/inkjars/3Ink.png'
import inkJar4Plus from '../../assets/images/displayElements/inkjars/4+ink.png'
import { hash01 } from '../bunnyLeapPath'

/** Ink jar art keyed by fill tier: 0 = empty … 4 = four or more. */
export const INK_JAR_SPRITES: readonly [string, string, string, string, string] = [
  inkJarEmpty,
  inkJar1,
  inkJar2,
  inkJar3,
  inkJar4Plus,
]

/** Discard pile inspect icon: empty bin vs cards visible in the bin. */
export function discardInspectSpriteForCount(discardCount: number): string {
  return discardCount > 0 ? discardInspectSpriteFull : discardInspectSprite
}

/** Picks jar art from current ink (0–3 map 1:1; 4+ uses the full jar). */
export function inkJarSpriteForCount(ink: number): string {
  if (ink <= 0) return INK_JAR_SPRITES[0]
  if (ink === 1) return INK_JAR_SPRITES[1]
  if (ink === 2) return INK_JAR_SPRITES[2]
  if (ink === 3) return INK_JAR_SPRITES[3]
  return INK_JAR_SPRITES[4]
}

export {
  mapBackground,
  openDoor,
  tinypoof as relicRejectPoofSprite,
  castStar as castBurstSprite,
  deckInspectSprite,
  discardInspectSprite,
  xtoCloseIcon as inspectPileCloseIcon,
  senjafudaFrame,
  tallscroll,
  bunnyIrisOutline,
  blueCarpet,
  blackCarpet,
  blackCarpet2,
  greenCarpet,
  mythicCarpet,
  leatherCarpet,
  collectorSprite,
  speechBubbleRightSprite,
  fontOfLetheEmpty,
  fontOfLetheFull,
  printerSprite,
  coin1Sprite,
  coin2Sprite,
  goldBagSprite,
  keySprite,
  pathDoorLockSprite,
  cauldronSprite,
  longbeltSprite,
  shopShelvesSprite,
  restingSprite,
  sleepIllustrationSprite,
  studyIllustrationSprite,
  playerPlaceholderSprite,
  shieldSprite,
  brokenShieldSprite,
  lockedShieldSprite,
}

export const GOLD_COIN_SPRITES: readonly [string, string] = [coin1Sprite, coin2Sprite]

/** Sprites for gold-bag pickup coin burst (alternating faces). */
export const GOLD_BURST_SPRITES: readonly string[] = [
  coin1Sprite,
  coin2Sprite,
  coin1Sprite,
  coin2Sprite,
  coin1Sprite,
  coin2Sprite,
  coin1Sprite,
  coin2Sprite,
]

/** Sprites used for relic-offer rejection smoke puffs. */
export const RELIC_REJECT_PUFF_SPRITES: readonly string[] = [
  leapingBunnyFront,
  leapingBunnyBack,
  tinyBunny,
  tinypoof,
  leapingBunnyFront,
  tinypoof,
  tinyBunny,
  leapingBunnyBack,
]

/** Sprites pool for end-of-turn bunny release (one picked per released bunny). */
export const BUNNY_RELEASE_PUFF_SPRITE_POOL: readonly string[] = [
  leapingBunnyFront,
  leapingBunnyBack,
  tinyBunny,
  poof,
  bigPoof,
  tinypoof,
]

export {
  poof as bunnyReleasePoofSprite,
  bigPoof as bunnyReleaseBigPoofSprite,
  tinypoof as bunnyReleaseTinyPoofSprite,
  consumeCardAftermath as consumeCardAftermathSprite,
}

/** Sprites for card-consume smoke puffs (poof family only). */
export const CARD_CONSUME_PUFF_SPRITE_POOL: readonly string[] = [
  poof,
  bigPoof,
  tinypoof,
  poof,
  tinypoof,
  bigPoof,
]

export const BUNNY_LEAP_SPRITES: readonly [string, string] = [leapingBunnyBack, tinyBunny]

export function bunnyLeapSpriteForSeed(seed: number): string {
  return BUNNY_LEAP_SPRITES[Math.floor(hash01(seed, 3) * BUNNY_LEAP_SPRITES.length)] ?? BUNNY_LEAP_SPRITES[0]
}

/** Sprites pool for fire-tagged card casts (alternating spark art). */
export const FIRE_RELEASE_SPARK_SPRITE_POOL: readonly string[] = [spark1Sprite, spark2Sprite]

export const SPARK_LEAP_SPRITES: readonly [string, string] = [spark1Sprite, spark2Sprite]

export function sparkLeapSpriteForSeed(seed: number): string {
  return SPARK_LEAP_SPRITES[Math.floor(hash01(seed, 3) * SPARK_LEAP_SPRITES.length)] ?? SPARK_LEAP_SPRITES[0]
}

export function sparkLeapLandSpriteForSeed(seed: number): string {
  return SPARK_LEAP_SPRITES[Math.floor(hash01(seed, 7) * SPARK_LEAP_SPRITES.length)] ?? SPARK_LEAP_SPRITES[0]
}

/** Sprites used for card-cast star bursts (same sprite, varied motion per particle). */
export const CAST_BURST_SPRITES: readonly string[] = [
  castStar,
  castStar,
  castStar,
  castStar,
  castStar,
  castStar,
  castStar,
]
