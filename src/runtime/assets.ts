import { AssetManifest } from '../assets/manifest'
import { BACKDROP_PRELOAD_URLS } from '../render/assets/backdropImages'
import { CARD_PRELOAD_URLS } from '../render/assets/cardImages'
import { COMBAT_INTENT_PRELOAD_URLS } from '../render/assets/combatIntentImages'
import { DISPLAY_PRELOAD_URLS } from '../render/assets/displayImages'
import { PATH_DOOR_PRELOAD_URLS } from '../render/assets/doorImages'
import { ENCHANTMENT_PRELOAD_URLS } from '../render/enchantmentSpriteImages'
import { GEM_PRELOAD_URLS } from '../render/assets/gemImages'
import { MONSTER_PRELOAD_URLS } from '../render/assets/monsterSprites'
import { RELIC_PRELOAD_URLS } from '../render/assets/relicImages'

const PRELOAD_IMAGES = [
  ...new Set([
    ...AssetManifest.images,
    ...BACKDROP_PRELOAD_URLS,
    ...DISPLAY_PRELOAD_URLS,
    ...RELIC_PRELOAD_URLS,
    ...GEM_PRELOAD_URLS,
    ...CARD_PRELOAD_URLS,
    ...PATH_DOOR_PRELOAD_URLS,
    ...MONSTER_PRELOAD_URLS,
    ...COMBAT_INTENT_PRELOAD_URLS,
    ...ENCHANTMENT_PRELOAD_URLS,
  ]),
]

export async function preloadAssets(
  onProgress?: (loaded: number, total: number) => void,
): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = []
  const failed: string[] = []
  const total = PRELOAD_IMAGES.length

  onProgress?.(0, total)

  await Promise.all(
    PRELOAD_IMAGES.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            loaded.push(src)
            onProgress?.(loaded.length + failed.length, total)
            resolve()
          }
          img.onerror = () => {
            failed.push(src)
            onProgress?.(loaded.length + failed.length, total)
            resolve()
          }
          img.src = src
        }),
    ),
  )

  return { loaded, failed }
}
