import {
  MONSTER_SPRITE_RECOLOR_THRESHOLD,
  MONSTER_SPRITE_SOLID_COLOR_LUMA,
} from './recolorDarkPixels'

const recolorCache = new Map<string, string>()

export function recolorCacheKey(imageSrc: string, hexColor: string): string {
  return `${imageSrc}|${hexColor}|${MONSTER_SPRITE_RECOLOR_THRESHOLD}|${MONSTER_SPRITE_SOLID_COLOR_LUMA}`
}

export function getRecoloredSrc(imageSrc: string, hexColor: string): string | undefined {
  return recolorCache.get(recolorCacheKey(imageSrc, hexColor))
}

export function setRecoloredSrc(imageSrc: string, hexColor: string, dataUrl: string): void {
  recolorCache.set(recolorCacheKey(imageSrc, hexColor), dataUrl)
}
