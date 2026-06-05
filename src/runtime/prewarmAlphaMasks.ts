import {
  deckInspectSprite,
  discardInspectSprite,
  discardInspectSpriteFull,
  fontOfLetheFull,
  inspectPileCloseIcon,
} from '../render/assets/displayImages'
import { getAlphaMask, rasterizeAlphaMaskFromSrc, setAlphaMask } from '../render/alphaMaskCache'

export const ALPHA_PREWARM_URLS: readonly string[] = [
  deckInspectSprite,
  discardInspectSprite,
  discardInspectSpriteFull,
  inspectPileCloseIcon,
  fontOfLetheFull,
]

export async function prewarmAlphaMasks(
  urls: readonly string[],
  onMaskDone?: () => void,
): Promise<void> {
  for (const src of urls) {
    if (!getAlphaMask(src)) {
      try {
        const data = await rasterizeAlphaMaskFromSrc(src)
        setAlphaMask(src, data)
      } catch {
        // Fall back to runtime rasterization on first interaction.
      }
    }
    onMaskDone?.()
  }
}
