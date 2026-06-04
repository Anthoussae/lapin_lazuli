import { useLayoutEffect, useRef, type RefObject } from 'react'
import { fitCardFontScales, resetCardFontScales, type CardFontScales } from './cardFontScale'

export function useCardFontScale(
  enabled: boolean,
  contentKey: string,
): Readonly<{
  cardRef: RefObject<HTMLDivElement>
  overlayRef: RefObject<HTMLDivElement>
  fontScales: CardFontScales
}> {
  const cardRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const fontScalesRef = useRef<CardFontScales>({ name: 1, ink: 1, text: 1 })

  useLayoutEffect(() => {
    const card = cardRef.current
    const overlay = overlayRef.current
    if (!card || !overlay) {
      fontScalesRef.current = { name: 1, ink: 1, text: 1 }
      if (card) resetCardFontScales(card)
      return
    }

    const apply = () => {
      if (enabled) {
        fontScalesRef.current = fitCardFontScales(card, overlay)
      } else {
        resetCardFontScales(card)
        fontScalesRef.current = { name: 1, ink: 1, text: 1 }
      }
    }

    apply()

    const ro = new ResizeObserver(apply)
    ro.observe(card)
    return () => ro.disconnect()
  }, [enabled, contentKey])

  return { cardRef, overlayRef, fontScales: fontScalesRef.current }
}
