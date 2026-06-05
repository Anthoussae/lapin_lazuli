import { Enemies } from '../data/enemies'
import { monsterSpriteForFilename } from '../render/assets/monsterSprites'
import { getRecoloredSrc, setRecoloredSrc } from '../render/recolorCache'
import {
  MONSTER_SPRITE_RECOLOR_THRESHOLD,
  MONSTER_SPRITE_SOLID_COLOR_LUMA,
  recolorImageSrcToDataUrl,
} from '../render/recolorDarkPixels'

export type RecolorPair = Readonly<{ imageSrc: string; hexColor: string }>

export function collectRecolorPairs(): RecolorPair[] {
  const seen = new Set<string>()
  const pairs: RecolorPair[] = []

  for (const enemy of Object.values(Enemies)) {
    if (!enemy.sprite || !enemy.color) continue
    const imageSrc = monsterSpriteForFilename(enemy.sprite)
    const key = `${imageSrc}|${enemy.color}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push({ imageSrc, hexColor: enemy.color })
  }

  return pairs
}

export async function prewarmRecolorPairs(
  pairs: readonly RecolorPair[],
  onPairDone?: () => void,
): Promise<void> {
  for (const pair of pairs) {
    if (!getRecoloredSrc(pair.imageSrc, pair.hexColor)) {
      try {
        const dataUrl = await recolorImageSrcToDataUrl(pair.imageSrc, pair.hexColor, {
          threshold: MONSTER_SPRITE_RECOLOR_THRESHOLD,
          solidDarkLuma: MONSTER_SPRITE_SOLID_COLOR_LUMA,
        })
        setRecoloredSrc(pair.imageSrc, pair.hexColor, dataUrl)
      } catch {
        // Fall back to runtime recolor in combat if prewarm fails.
      }
    }
    onPairDone?.()
  }
}
