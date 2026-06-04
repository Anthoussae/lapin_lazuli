import { useEffect, useState } from 'react'
import {
  MONSTER_SPRITE_RECOLOR_THRESHOLD,
  MONSTER_SPRITE_SOLID_COLOR_LUMA,
  recolorImageSrcToDataUrl,
} from '../recolorDarkPixels'

const recolorCache = new Map<string, string>()

function cacheKey(imageSrc: string, hexColor: string): string {
  return `${imageSrc}|${hexColor}|${MONSTER_SPRITE_RECOLOR_THRESHOLD}|${MONSTER_SPRITE_SOLID_COLOR_LUMA}`
}

/**
 * Returns `imageSrc`, or a cached recolored data URL when `hexColor` is set.
 * Falls back to the original src if recoloring fails.
 */
export function useRecoloredImageSrc(imageSrc: string, hexColor: string | undefined): string {
  const [displaySrc, setDisplaySrc] = useState(imageSrc)

  useEffect(() => {
    if (!hexColor) {
      setDisplaySrc(imageSrc)
      return
    }

    const key = cacheKey(imageSrc, hexColor)
    const cached = recolorCache.get(key)
    if (cached) {
      setDisplaySrc(cached)
      return
    }

    let cancelled = false
    recolorImageSrcToDataUrl(imageSrc, hexColor, {
      threshold: MONSTER_SPRITE_RECOLOR_THRESHOLD,
      solidDarkLuma: MONSTER_SPRITE_SOLID_COLOR_LUMA,
    })
      .then((dataUrl) => {
        if (cancelled) return
        recolorCache.set(key, dataUrl)
        setDisplaySrc(dataUrl)
      })
      .catch(() => {
        if (!cancelled) setDisplaySrc(imageSrc)
      })

    return () => {
      cancelled = true
    }
  }, [imageSrc, hexColor])

  return displaySrc
}
