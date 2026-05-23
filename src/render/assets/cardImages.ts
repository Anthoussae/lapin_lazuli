import cardFrontArt from '../../assets/images/cardBacks/basic.png'
import cardBackArt from '../../assets/images/cardBacks/reverse.png'
import cardIllustrationPlaceholder from '../../assets/images/displayElements/inkdrop.png'

export { cardFrontArt, cardBackArt, cardIllustrationPlaceholder }

import { CARD_ILLUSTRATION_PRELOAD_URLS } from './cardIllustrationImages'

export const CARD_PRELOAD_URLS: readonly string[] = [
  cardFrontArt,
  cardBackArt,
  cardIllustrationPlaceholder,
  ...CARD_ILLUSTRATION_PRELOAD_URLS,
]
