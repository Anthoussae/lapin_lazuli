import { AssetManifest } from '../assets/manifest'
import { PATH_DOOR_PRELOAD_URLS } from '../render/assets/doorImages'
import { RELIC_PRELOAD_URLS } from '../render/assets/relicImages'
import { CARD_PRELOAD_URLS } from '../render/assets/cardImages'

const PRELOAD_IMAGES = [
  ...AssetManifest.images,
  ...RELIC_PRELOAD_URLS,
  ...CARD_PRELOAD_URLS,
  ...PATH_DOOR_PRELOAD_URLS,
]

export async function preloadAssets(): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = []
  const failed: string[] = []

  await Promise.all(
    PRELOAD_IMAGES.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            loaded.push(src)
            resolve()
          }
          img.onerror = () => {
            failed.push(src)
            resolve()
          }
          img.src = src
        }),
    ),
  )

  return { loaded, failed }
}

