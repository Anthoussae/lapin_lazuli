import { useMemo } from 'react'
import { bunnyIrisOutline } from '../assets/displayImages'
import { readIrisPathShape, readIrisShape } from '../irisShape'

export type IrisCenter = Readonly<{
  xPercent: number
  yPercent: number
}>

/** Path color-out (close) vs clear-out (re-open same shape to drop the matte). */
export type PathIrisMask = 'color' | 'clear'

/** Screen iris matte fill (default purple; black for defeat → title). */
export type ScreenIrisColor = 'default' | 'black'

type IrisOverlayProps = Readonly<{
  variant?: 'screen' | 'path'
  mode: 'out' | 'in'
  center: IrisCenter
  /** Screen variant only. */
  screenColor?: ScreenIrisColor
  /** Path variant only: first pass closes color; second pass opens the hole again. */
  pathMask?: PathIrisMask
  /** Path variant only: freeze at full cover between color-out and clear-out. */
  hold?: boolean
  onComplete: () => void
}>

export function IrisOverlay(props: IrisOverlayProps) {
  const {
    variant = 'screen',
    mode,
    center,
    screenColor = 'default',
    pathMask = 'color',
    hold = false,
    onComplete,
  } = props
  const shape = useMemo(
    () => (variant === 'path' ? readIrisPathShape() : readIrisShape()),
    [variant],
  )

  const overlayStyle = useMemo(() => {
    if (variant === 'path') {
      return {
        ['--iris-path-center-x' as string]: `${center.xPercent}%`,
        ['--iris-path-center-y' as string]: `${center.yPercent}%`,
        ...(shape === 'bunny'
          ? { ['--iris-path-bunny-mask-image' as string]: `url(${bunnyIrisOutline})` }
          : {}),
      } as const
    }
    return {
      ['--iris-center-x' as string]: `${center.xPercent}%`,
      ['--iris-center-y' as string]: `${center.yPercent}%`,
      ...(shape === 'bunny'
        ? { ['--iris-bunny-mask-image' as string]: `url(${bunnyIrisOutline})` }
        : {}),
    } as const
  }, [center.xPercent, center.yPercent, shape, variant])

  const rootClass =
    variant === 'path'
      ? [
          'irisPathOverlay',
          `irisPathOverlay--${mode}`,
          `irisPathOverlay--shape-${shape}`,
          `irisPathOverlay--mask-${pathMask}`,
          hold ? 'irisPathOverlay--hold' : null,
        ]
          .filter(Boolean)
          .join(' ')
      : [
          'irisOverlay',
          `irisOverlay--${mode}`,
          `irisOverlay--shape-${shape}`,
          screenColor === 'black' ? 'irisOverlay--color-black' : null,
        ]
          .filter(Boolean)
          .join(' ')

  return (
    <div
      className={rootClass}
      style={overlayStyle}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return
        onComplete()
      }}
      aria-hidden
    />
  )
}
