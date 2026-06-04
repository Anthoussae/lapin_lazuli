/** RGB target color for dark-pixel recoloring (0–255 per channel). */
export type RgbColor = Readonly<{ r: number; g: number; b: number }>

export type RecolorDarkPixelsOptions = Readonly<{
  /**
   * Pixels whose strongest channel exceeds this value are left unchanged
   * (e.g. white background). 0–255. Default 128.
   */
  threshold?: number
  /**
   * Pixels at or below this luma are replaced with the full target color (no blend).
   * 0–255. Default 0 (only pure black is fully replaced unless threshold covers it).
   */
  solidDarkLuma?: number
  /** Pixels with alpha below this are skipped. 0–255. Default 8. */
  alphaMin?: number
}>

const DEFAULT_THRESHOLD = 128
const DEFAULT_ALPHA_MIN = 8

/** Max luma recolored for enemy sprites; light background stays above this. */
export const MONSTER_SPRITE_RECOLOR_THRESHOLD = 240
/** Black and very dark line art → solid primary color. */
export const MONSTER_SPRITE_SOLID_COLOR_LUMA = 96

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

/** Parses `#rrggbb` or `rrggbb` into RGB bytes. */
export function parseHexRgb(hex: string): RgbColor {
  const normalized = hex.trim().replace(/^#/, '')
  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex color, got "${hex}"`)
  }
  const n = Number.parseInt(normalized, 16)
  if (Number.isNaN(n)) {
    throw new Error(`Invalid hex color "${hex}"`)
  }
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  }
}

function tintStrengthForLuma(luma: number, threshold: number, solidDarkLuma: number): number {
  if (luma <= solidDarkLuma) return 1
  if (threshold <= solidDarkLuma) return 0
  return 1 - (luma - solidDarkLuma) / (threshold - solidDarkLuma)
}

/**
 * Recolors dark pixels in place toward `targetColor`.
 *
 * Black and dark pixels use the primary color (full strength at luma 0). Mid-dark
 * pixels blend from the target color toward the original for anti-aliased edges.
 * Pixels above `threshold` are unchanged.
 */
export function recolorDarkPixelsInPlace(
  imageData: ImageData,
  targetColor: RgbColor,
  options: RecolorDarkPixelsOptions = {},
): void {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD
  const solidDarkLuma = options.solidDarkLuma ?? 0
  const alphaMin = options.alphaMin ?? DEFAULT_ALPHA_MIN
  const { r: tr, g: tg, b: tb } = targetColor
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!
    if (a < alphaMin) continue

    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const luma = Math.max(r, g, b)
    if (luma > threshold) continue

    const strength = tintStrengthForLuma(luma, threshold, solidDarkLuma)
    const keep = 1 - strength
    data[i] = clampByte(tr * strength + r * keep)
    data[i + 1] = clampByte(tg * strength + g * keep)
    data[i + 2] = clampByte(tb * strength + b * keep)
  }
}

/** Loads a bundled image URL, recolors dark pixels, and returns a PNG data URL. */
export function recolorImageSrcToDataUrl(
  imageSrc: string,
  hexColor: string,
  options: RecolorDarkPixelsOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (w === 0 || h === 0) {
        reject(new Error('Image has zero dimensions'))
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Canvas 2d context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      recolorDarkPixelsInPlace(imageData, parseHexRgb(hexColor), options)
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error(`Failed to load image "${imageSrc}"`))
    img.src = imageSrc
  })
}
