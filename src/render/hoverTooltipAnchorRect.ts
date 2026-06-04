import { readRootNumber, readRootPxVar } from './relicTooltipPosition'

/** Top-left of an element's border box in viewport coords (ignores the element's own transform). */
function layoutTopLeftInViewport(element: HTMLElement): Readonly<{ x: number; y: number }> {
  const parent = element.offsetParent
  if (!(parent instanceof HTMLElement)) {
    const rect = element.getBoundingClientRect()
    return { x: rect.left, y: rect.top }
  }
  const parentRect = parent.getBoundingClientRect()
  return {
    x: parentRect.left + element.offsetLeft,
    y: parentRect.top + element.offsetTop,
  }
}

/**
 * Viewport bounds as if the element is at full hover scale (center-fixed).
 * Uses layout size × scale so position stays fixed during CSS scale transitions.
 */
export function hoverTooltipAnchorRect(
  element: HTMLElement,
  rect: DOMRect,
  maxHoverScale: number,
): DOMRect {
  if (maxHoverScale <= 1 || !Number.isFinite(maxHoverScale)) return rect

  const layoutW = element.offsetWidth
  const layoutH = element.offsetHeight
  if (layoutW <= 0 || layoutH <= 0) return rect

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const w = layoutW * maxHoverScale
  const h = layoutH * maxHoverScale
  return new DOMRect(cx - w / 2, cy - h / 2, w, h)
}

/**
 * Hand fan hover endpoint: slot unrotated, full card scale, final arc lift.
 * Derived from layout box + tokens so rotation/scale transitions do not move tooltips.
 */
function handFanCardHoverTooltipAnchorRect(card: HTMLElement, slot: HTMLElement): DOMRect {
  const w = card.offsetWidth
  const h = card.offsetHeight
  const hoverScale = readRootNumber('--game-card-hover-scale', 1)
  const hoverLift = readRootPxVar('--hand-fan-hover-lift')
  const { x: layoutX, y: layoutY } = layoutTopLeftInViewport(slot)

  const left = layoutX + (w / 2) * (1 - hoverScale)
  const top = layoutY + (h / 2) * (1 - hoverScale) + hoverLift
  return new DOMRect(left, top, w * hoverScale, h * hoverScale)
}

/** Game card keyword/foil tooltips — anchored at full hover size and fan pose. */
export function gameCardHoverTooltipAnchorRect(card: HTMLElement): DOMRect {
  const slot = card.closest('.handFan__slot')
  if (slot instanceof HTMLElement) {
    return handFanCardHoverTooltipAnchorRect(card, slot)
  }
  const rect = card.getBoundingClientRect()
  const hoverScale = readRootNumber('--game-card-hover-scale', 1)
  return hoverTooltipAnchorRect(card, rect, hoverScale)
}
