import type { RelicId } from '../../core/types/ids'
import eternalInkstone from '../../assets/images/relics/eternalInkstone.png'
import hydrangea from '../../assets/images/relics/hydrangea.png'
import scroll from '../../assets/images/relics/scroll.png'
import magicStaff from '../../assets/images/relics/magicStaff.png'
import gaolersKeychain from '../../assets/images/relics/gaolersKeychain.png'
import goldIngot from '../../assets/images/relics/goldIngot.png'
import magicWand from '../../assets/images/relics/magicWand.png'
import redHat from '../../assets/images/relics/redHat.png'
import encyclopaedia from '../../assets/images/relics/encyclopaedia.png'
import nazar from '../../assets/images/relics/nazar.png'
import goldenEgg from '../../assets/images/relics/goldenEgg.png'
import shakujo from '../../assets/images/relics/shakujo.png'
import grandmagusTome from '../../assets/images/relics/grandmagusTome.png'
import phoenixFeatherQuill from '../../assets/images/relics/phoenixFeatherQuill.png'
import paperBoat from '../../assets/images/relics/paperBoat.png'

export const relicImageMap: Partial<Record<RelicId, string>> = {
  KEYCHAIN: gaolersKeychain,
  ETERNAL_INKSTONE: eternalInkstone,
  HYDRANGEA: hydrangea,
  ARCANE_SCROLL: scroll,
  MAGIC_STAFF: magicStaff,
  GOLD_INGOT: goldIngot,
  MAGIC_WAND: magicWand,
  RED_HAT: redHat,
  PHOENIX_FEATHER_QUILL: phoenixFeatherQuill,
  ENCHANTED_ENCYCLOPAEDIA: encyclopaedia,
  NAZAR: nazar,
  LUCKY_EGG: goldenEgg,
  SHAKUJO: shakujo,
  MAGES_TOME: grandmagusTome,
  PAPER_BOAT: paperBoat,
}

export const RELIC_PRELOAD_URLS: readonly string[] = Object.values(relicImageMap).filter(
  (url): url is string => url != null,
)

export function relicImageSrc(id: RelicId): string | undefined {
  return relicImageMap[id]
}
