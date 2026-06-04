import type { CardId, GemId } from '../../core/types/ids'
import { isBurdenCardId } from '../../data/cards'
import cardFrontArt from '../../assets/images/cardBacks/basic.png'
import cardFrontBurdenArt from '../../assets/images/cardBacks/grey.png'
import cardFrontSocketedArt from '../../assets/images/cardBacks/giltFrontDark.png'
import cardBackArt from '../../assets/images/cardBacks/reverse.png'
import cardIllustrationPlaceholder from '../../assets/images/displayElements/inkdrop.png'

export { cardFrontArt, cardFrontBurdenArt, cardFrontSocketedArt, cardBackArt, cardIllustrationPlaceholder }

import { CARD_ILLUSTRATION_PRELOAD_URLS } from './cardIllustrationImages'

export function cardFrontArtForGem(
  socketedGemId: GemId | null | undefined,
  cardId?: CardId,
): string {
  if (cardId && isBurdenCardId(cardId)) return cardFrontBurdenArt
  return socketedGemId ? cardFrontSocketedArt : cardFrontArt
}

export const CARD_PRELOAD_URLS: readonly string[] = [
  cardFrontArt,
  cardFrontBurdenArt,
  cardFrontSocketedArt,
  cardBackArt,
  cardIllustrationPlaceholder,
  ...CARD_ILLUSTRATION_PRELOAD_URLS,
]
