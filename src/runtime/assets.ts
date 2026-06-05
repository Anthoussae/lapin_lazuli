import { AssetManifest } from '../assets/manifest'
import type { BootStage } from '../core/types/state'
import { BACKDROP_PRELOAD_URLS } from '../render/assets/backdropImages'
import { CARD_PRELOAD_URLS } from '../render/assets/cardImages'
import { COMBAT_INTENT_PRELOAD_URLS } from '../render/assets/combatIntentImages'
import { DISPLAY_PRELOAD_URLS } from '../render/assets/displayImages'
import { PATH_DOOR_PRELOAD_URLS } from '../render/assets/doorImages'
import { ENCHANTMENT_PRELOAD_URLS } from '../render/enchantmentSpriteImages'
import { GEM_PRELOAD_URLS } from '../render/assets/gemImages'
import { MONSTER_PRELOAD_URLS } from '../render/assets/monsterSprites'
import { RELIC_PRELOAD_URLS } from '../render/assets/relicImages'
import { ALPHA_PREWARM_URLS, prewarmAlphaMasks } from './prewarmAlphaMasks'
import { collectRecolorPairs, prewarmRecolorPairs } from './prewarmRecolors'

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

const IMAGE_CONCURRENCY = 8
const FONT_PRELOAD_SPECS = ['16px Luminari', '48px Luminari'] as const

async function loadAndDecodeImage(src: string): Promise<void> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(src))
    img.src = src
  })
  await img.decode()
}

async function runBatched<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0

  async function runWorker(): Promise<void> {
    while (index < items.length) {
      const item = items[index]!
      index += 1
      await worker(item)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  await Promise.all(workers)
}

async function preloadFonts(): Promise<void> {
  await Promise.all(FONT_PRELOAD_SPECS.map((spec) => document.fonts.load(spec)))
}

export async function preloadAssets(
  onProgress?: (loaded: number, total: number, bootStage: BootStage) => void,
): Promise<{ loaded: string[]; failed: string[] }> {
  const recolorPairs = collectRecolorPairs()
  const total =
    PRELOAD_IMAGES.length + recolorPairs.length + ALPHA_PREWARM_URLS.length + FONT_PRELOAD_SPECS.length
  let done = 0

  const report = (bootStage: BootStage) => {
    onProgress?.(done, total, bootStage)
  }

  const bump = (bootStage: BootStage) => {
    done += 1
    report(bootStage)
  }

  const loaded: string[] = []
  const failed: string[] = []

  report('IMAGES')

  await runBatched(PRELOAD_IMAGES, IMAGE_CONCURRENCY, async (src) => {
    try {
      await loadAndDecodeImage(src)
      loaded.push(src)
    } catch {
      failed.push(src)
    }
    bump('IMAGES')
  })

  if (failed.length) {
    return { loaded, failed }
  }

  report('RECOLORS')
  await prewarmRecolorPairs(recolorPairs, () => bump('RECOLORS'))

  report('MASKS')
  await prewarmAlphaMasks(ALPHA_PREWARM_URLS, () => bump('MASKS'))

  report('FONTS')
  await preloadFonts()
  for (let i = 0; i < FONT_PRELOAD_SPECS.length; i += 1) {
    bump('FONTS')
  }

  report('DONE')
  return { loaded, failed }
}
