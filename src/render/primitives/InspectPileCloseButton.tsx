import { useCallback, useLayoutEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { inspectPileCloseIcon } from '../assets/displayImages'

/** Treat softer anti-aliased edges as non-hit so only visibly opaque art closes. */
const INSPECT_CLOSE_ICON_ALPHA_THRESHOLD = 40

function rasterizeImageAlpha(img: HTMLImageElement): ImageData | null {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return null
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, w, h)
}

function readAlphaAtPixel(imageData: ImageData, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) return 0
  return imageData.data[(y * imageData.width + x) * 4 + 3] ?? 0
}

/** Map viewport coords to bitmap pixel for an `object-fit: contain` image in its layout box. */
function clientToNaturalPixel(
  clientX: number,
  clientY: number,
  imgRect: DOMRectReadOnly,
  naturalW: number,
  naturalH: number,
): { nx: number; ny: number } | null {
  const boxW = imgRect.width
  const boxH = imgRect.height
  const scale = Math.min(boxW / naturalW, boxH / naturalH)
  const drawnW = naturalW * scale
  const drawnH = naturalH * scale
  const offsetX = imgRect.left + (boxW - drawnW) / 2
  const offsetY = imgRect.top + (boxH - drawnH) / 2
  const lx = clientX - offsetX
  const ly = clientY - offsetY
  if (lx < 0 || ly < 0 || lx >= drawnW || ly >= drawnH) return null
  const nx = Math.min(naturalW - 1, Math.max(0, Math.floor((lx / drawnW) * naturalW)))
  const ny = Math.min(naturalH - 1, Math.max(0, Math.floor((ly / drawnH) * naturalH)))
  return { nx, ny }
}

function isInspectCloseOpaqueAtClient(
  img: HTMLImageElement,
  alphaData: ImageData,
  clientX: number,
  clientY: number,
): boolean {
  const pt = clientToNaturalPixel(clientX, clientY, img.getBoundingClientRect(), img.naturalWidth, img.naturalHeight)
  if (!pt) return false
  return readAlphaAtPixel(alphaData, pt.nx, pt.ny) >= INSPECT_CLOSE_ICON_ALPHA_THRESHOLD
}

export type InspectPileCloseButtonProps = Readonly<{
  onClose: () => void
  /** When false, skip priming alpha (e.g. when parent is not visible). */
  active?: boolean
}>

/**
 * Shared “X” close for inspect-style panels: PNG hit-test, hover brightness, keyboard close.
 * Styling: `.inspectDeckClose` / `.inspectDeckClose__img` in `game.css`.
 */
export function InspectPileCloseButton(props: InspectPileCloseButtonProps) {
  const { onClose, active = true } = props
  const inspectCloseBtnRef = useRef<HTMLButtonElement>(null)
  const inspectCloseImgRef = useRef<HTMLImageElement>(null)
  const inspectCloseAlphaRef = useRef<ImageData | null>(null)

  const primeInspectCloseAlpha = useCallback(() => {
    const img = inspectCloseImgRef.current
    if (!img) return
    inspectCloseAlphaRef.current = rasterizeImageAlpha(img)
  }, [])

  useLayoutEffect(() => {
    if (!active) return
    const img = inspectCloseImgRef.current
    if (img?.complete && img.naturalWidth > 0) primeInspectCloseAlpha()
  }, [active, primeInspectCloseAlpha])

  const ensureInspectCloseAlpha = useCallback((): ImageData | null => {
    const img = inspectCloseImgRef.current
    if (!img) return null
    let data = inspectCloseAlphaRef.current
    if (!data && img.complete && img.naturalWidth > 0) {
      data = rasterizeImageAlpha(img)
      inspectCloseAlphaRef.current = data
    }
    return data
  }, [])

  const syncInspectCloseHotFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const btn = inspectCloseBtnRef.current
      const img = inspectCloseImgRef.current
      if (!btn || !img) return
      const alphaData = ensureInspectCloseAlpha()
      if (!alphaData) {
        btn.classList.remove('inspectDeckClose--hot')
        return
      }
      const hot = isInspectCloseOpaqueAtClient(img, alphaData, clientX, clientY)
      btn.classList.toggle('inspectDeckClose--hot', hot)
    },
    [ensureInspectCloseAlpha],
  )

  const clearInspectCloseHot = useCallback(() => {
    inspectCloseBtnRef.current?.classList.remove('inspectDeckClose--hot')
  }, [])

  const onInspectCloseClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const img = inspectCloseImgRef.current
      if (!img) {
        onClose()
        return
      }
      const alphaData = ensureInspectCloseAlpha()
      if (!alphaData) {
        onClose()
        return
      }
      if (!isInspectCloseOpaqueAtClient(img, alphaData, e.clientX, e.clientY)) return
      onClose()
    },
    [onClose, ensureInspectCloseAlpha],
  )

  const onInspectCloseKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      onClose()
    },
    [onClose],
  )

  return (
    <button
      ref={inspectCloseBtnRef}
      type="button"
      className="inspectDeckClose"
      onClick={onInspectCloseClick}
      onPointerMove={(e) => syncInspectCloseHotFromClient(e.clientX, e.clientY)}
      onPointerLeave={clearInspectCloseHot}
      onPointerDown={(e) => syncInspectCloseHotFromClient(e.clientX, e.clientY)}
      onKeyDown={onInspectCloseKeyDown}
      aria-label="Close"
    >
      <img
        ref={inspectCloseImgRef}
        className="inspectDeckClose__img"
        src={inspectPileCloseIcon}
        alt=""
        draggable={false}
        onLoad={primeInspectCloseAlpha}
      />
    </button>
  )
}
