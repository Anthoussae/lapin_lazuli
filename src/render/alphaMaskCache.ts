const alphaMaskCache = new Map<string, ImageData>()

export function getAlphaMask(src: string): ImageData | undefined {
  return alphaMaskCache.get(src)
}

export function setAlphaMask(src: string, data: ImageData): void {
  alphaMaskCache.set(src, data)
}

export async function rasterizeAlphaMaskFromSrc(src: string): Promise<ImageData> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image "${src}"`))
    img.src = src
  })
  await img.decode()

  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) {
    throw new Error(`Image has zero dimensions: "${src}"`)
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Canvas 2d context unavailable')
  }

  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, w, h)
}
