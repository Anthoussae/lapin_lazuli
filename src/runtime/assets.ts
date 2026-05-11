import { AssetManifest } from '../assets/manifest'

export async function preloadAssets(): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = []
  const failed: string[] = []

  await Promise.all(
    AssetManifest.images.map(
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

