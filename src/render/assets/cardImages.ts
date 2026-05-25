import type { GemId } from '../../core/types/ids'
import cardFrontArt from '../../assets/images/cardBacks/basic.png'
import cardFrontSocketedArt from '../../assets/images/cardBacks/giltFrontDark.png'
import cardBackArt from '../../assets/images/cardBacks/reverse.png'
import cardIllustrationPlaceholder from '../../assets/images/displayElements/inkdrop.png'

export { cardFrontArt, cardFrontSocketedArt, cardBackArt, cardIllustrationPlaceholder }

import { CARD_ILLUSTRATION_PRELOAD_URLS } from './cardIllustrationImages'

export function cardFrontArtForGem(socketedGemId: GemId | null | undefined): string {
  return socketedGemId ? cardFrontSocketedArt : cardFrontArt
}

export const CARD_PRELOAD_URLS: readonly string[] = [
  cardFrontArt,
  cardFrontSocketedArt,
  cardBackArt,
  cardIllustrationPlaceholder,
  ...CARD_ILLUSTRATION_PRELOAD_URLS,
]
