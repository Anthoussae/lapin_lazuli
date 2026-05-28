import type { RelicId } from '../../core/types/ids'
import eternalInkstone from '../../assets/images/relics/eternalInkstone.png'
import hydrangea from '../../assets/images/relics/hydrangea.png'
import scroll from '../../assets/images/relics/scroll.png'
import magicStaff from '../../assets/images/relics/magicStaff.png'
import gaolersKeychain from '../../assets/images/relics/gaolersKeychain.png'
import goldIngot from '../../assets/images/relics/goldIngot.png'
import magicWand from '../../assets/images/relics/magicWand.png'
import redHat from '../../assets/images/relics/redHat.png'
import greenHat from '../../assets/images/relics/greenHat.png'
import encyclopaedia from '../../assets/images/relics/encyclopaedia.png'
import nazar from '../../assets/images/relics/nazar.png'
import goldenEgg from '../../assets/images/relics/goldenEgg.png'
import shakujo from '../../assets/images/relics/shakujo.png'
import grandmagusTome from '../../assets/images/relics/grandmagusTome.png'
import phoenixFeatherQuill from '../../assets/images/relics/phoenixFeatherQuill.png'
import paperBoat from '../../assets/images/relics/paperBoat.png'
import nursesHat from '../../assets/images/relics/nursesHat.png'
import pocketMoon from '../../assets/images/relics/pocketMoon.png'
import tarotDeck from '../../assets/images/relics/tarotDeck.png'
import orchid from '../../assets/images/relics/orchid.png'
import brush from '../../assets/images/relics/brush.png'
import backpack from '../../assets/images/relics/backpack.png'
import ryo from '../../assets/images/relics/ryo.png'
import woodenShield from '../../assets/images/relics/woodenShield.png'
import copperAlembics from '../../assets/images/relics/copperAlembics.png'
import wolfsbane from '../../assets/images/relics/wolfsbane.png'

export const relicImageMap: Partial<Record<RelicId, string>> = {
  KEYCHAIN: gaolersKeychain,
  ETERNAL_INKSTONE: eternalInkstone,
  HYDRANGEA: hydrangea,
  ARCANE_SCROLL: scroll,
  MAGIC_STAFF: magicStaff,
  GOLD_INGOT: goldIngot,
  MAGIC_WAND: magicWand,
  RED_HAT: redHat,
  GREEN_HAT: greenHat,
  PHOENIX_FEATHER_QUILL: phoenixFeatherQuill,
  ENCHANTED_ENCYCLOPAEDIA: encyclopaedia,
  NAZAR: nazar,
  LUCKY_EGG: goldenEgg,
  SHAKUJO: shakujo,
  MAGES_TOME: grandmagusTome,
  PAPER_BOAT: paperBoat,
  NURSES_HAT: nursesHat,
  POCKET_MOON: pocketMoon,
  TAROT_DECK: tarotDeck,
  ORCHID: orchid,
  PAINTBRUSH: brush,
  BACKPACK: backpack,
  RYO: ryo,
  WOODEN_SHIELD: woodenShield,
  COPPER_ALEMBICS: copperAlembics,
  SPRIG_OF_WOLFSBANE: wolfsbane,
}

export const RELIC_PRELOAD_URLS: readonly string[] = Object.values(relicImageMap).filter(
  (url): url is string => url != null,
)

export function relicImageSrc(id: RelicId): string | undefined {
  return relicImageMap[id]
}
