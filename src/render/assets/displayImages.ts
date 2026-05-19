import mapBackground from '../../assets/images/displayElements/mapBackground.png'
import deckInspectSprite from '../../assets/images/displayElements/deck.png'
import discardInspectSprite from '../../assets/images/displayElements/discarded cards.png'
import coin1Sprite from '../../assets/images/displayElements/coin1.png'
import coin2Sprite from '../../assets/images/displayElements/coin2.png'
import goldBagSprite from '../../assets/images/displayElements/GoldBag.png'
import keySprite from '../../assets/images/displayElements/key.png'
import senjafudaFrame from '../../assets/images/displayElements/senjafudaFrame.png'
import tallscroll from '../../assets/images/displayElements/tallscroll.png'
import blueCarpet from '../../assets/images/displayElements/blueCarpet.png'
import mythicCarpet from '../../assets/images/displayElements/mythicCarpet.png'
import leapingBunnyBack from '../../assets/images/displayElements/leapingBunnyBack.png'
import leapingBunnyFront from '../../assets/images/displayElements/leapingBunnyFront.png'
import tinyBunny from '../../assets/images/displayElements/tinyBunny.png'
import tinypoof from '../../assets/images/displayElements/tinypoof.png'
import castStar from '../../assets/images/displayElements/castStar.png'
import cauldronSprite from '../../assets/images/displayElements/cauldron.png'
import inkJarEmpty from '../../assets/images/displayElements/inkjars/emptyInk.png'
import inkJar1 from '../../assets/images/displayElements/inkjars/1Ink.png'
import inkJar2 from '../../assets/images/displayElements/inkjars/2Ink.png'
import inkJar3 from '../../assets/images/displayElements/inkjars/3Ink.png'
import inkJar4Plus from '../../assets/images/displayElements/inkjars/4+ink.png'

/** Ink jar art keyed by fill tier: 0 = empty … 4 = four or more. */
export const INK_JAR_SPRITES: readonly [string, string, string, string, string] = [
  inkJarEmpty,
  inkJar1,
  inkJar2,
  inkJar3,
  inkJar4Plus,
]

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
  tinypoof as relicRejectPoofSprite,
  castStar as castBurstSprite,
  deckInspectSprite,
  discardInspectSprite,
  senjafudaFrame,
  tallscroll,
  blueCarpet,
  mythicCarpet,
  coin1Sprite,
  coin2Sprite,
  goldBagSprite,
  keySprite,
  cauldronSprite,
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
