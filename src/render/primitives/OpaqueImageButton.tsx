import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
} from 'react'

const ALPHA_HIT_THRESHOLD = 24

type OpaqueImageButtonProps = Readonly<{
  src: string
  alt: string
  className?: string
  imageClassName?: string
  imageRef?: MutableRefObject<HTMLImageElement | null>
  hoverOverlay?: ReactNode
  /** Remount key for the image (e.g. trigger FX replay). */
  imageKey?: number
  onClick: () => void
}>

export const OpaqueImageButton = forwardRef<HTMLButtonElement, OpaqueImageButtonProps>(function OpaqueImageButton(
  props,
  ref,
) {
  const { src, alt, className, imageClassName, imageRef, hoverOverlay, imageKey, onClick } = props
  const hitImgRef = useRef<HTMLImageElement | null>(null)

  const setImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      hitImgRef.current = node
      if (imageRef) imageRef.current = node
    },
    [imageRef],
  )
  const alphaRef = useRef<Uint8ClampedArray | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const [lit, setLit] = useState(false)

  const loadAlphaMask = useCallback((img: HTMLImageElement) => {
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (w === 0 || h === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.drawImage(img, 0, 0)
    alphaRef.current = ctx.getImageData(0, 0, w, h).data
    sizeRef.current = { w, h }
  }, [])

  const hitOpaque = useCallback((clientX: number, clientY: number): boolean => {
    const img = hitImgRef.current
    const alpha = alphaRef.current
    const { w, h } = sizeRef.current
    if (!img || !alpha || w === 0 || h === 0) return false

    const rect = img.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false

    const x = Math.floor(((clientX - rect.left) / rect.width) * w)
    const y = Math.floor(((clientY - rect.top) / rect.height) * h)
    if (x < 0 || y < 0 || x >= w || y >= h) return false

    return alpha[(y * w + x) * 4 + 3]! > ALPHA_HIT_THRESHOLD
  }, [])

  const updateLit = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const over = hitOpaque(e.clientX, e.clientY)
      setLit(over)
    },
    [hitOpaque],
  )

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!hitOpaque(e.clientX, e.clientY)) return
      onClick()
    },
    [hitOpaque, onClick],
  )

  const classes = [className, lit ? 'opaqueImageBtn--lit' : null].filter(Boolean).join(' ')

  return (
    <button
      ref={ref}
      type="button"
      className={classes || undefined}
      aria-label={alt}
      onClick={handleClick}
      onMouseMove={updateLit}
      onMouseLeave={() => setLit(false)}
    >
      <img
        key={imageKey}
        ref={setImageRef}
        className={imageClassName ?? 'opaqueImageBtn__img'}
        src={src}
        alt=""
        draggable={false}
        onLoad={(e) => loadAlphaMask(e.currentTarget)}
      />
      {lit && hoverOverlay != null ? (
        <span className="opaqueImageBtn__hoverOverlay" aria-hidden>
          {hoverOverlay}
        </span>
      ) : null}
    </button>
  )
})
