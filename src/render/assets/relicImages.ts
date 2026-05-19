import type { RelicId } from '../../core/types/ids'
import eternalInkstone from '../../assets/images/relics/eternalInkstone.png'
import hydrangea from '../../assets/images/relics/hydrangea.png'
import scroll from '../../assets/images/relics/scroll.png'
import magicStaff from '../../assets/images/relics/magicStaff.png'
import gaolersKeychain from '../../assets/images/relics/gaolersKeychain.png'
import goldIngot from '../../assets/images/relics/goldIngot.png'
import magicWand from '../../assets/images/relics/magicWand.png'
import encyclopaedia from '../../assets/images/relics/encyclopaedia.png'
import nazar from '../../assets/images/relics/nazar.png'
import goldenEgg from '../../assets/images/relics/goldenEgg.png'
import shakujo from '../../assets/images/relics/shakujo.png'

export const relicImageMap: Partial<Record<RelicId, string>> = {
  KEYCHAIN: gaolersKeychain,
  INKPOT: eternalInkstone,
  HEART: hydrangea,
  SCROLL: scroll,
  FLASK: magicStaff,
  GOLD_COIN: goldIngot,
  WAND: magicWand,
  BOOK: encyclopaedia,
  NAZAR: nazar,
  LUCKY_CLOVER: goldenEgg,
  GARNET_TIARA: shakujo,
}

export const RELIC_PRELOAD_URLS: readonly string[] = Object.values(relicImageMap).filter(
  (url): url is string => url != null,
)

export function relicImageSrc(id: RelicId): string | undefined {
  return relicImageMap[id]
}
