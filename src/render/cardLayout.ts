import { viewportPointRelativeTo } from './relicBeltLayout'

/** Viewport rect of the visible card element inside an offer button or slot. */
export function cardViewportRect(el: HTMLElement): DOMRect {
  const card = el.querySelector<HTMLElement>('.gameCard') ?? el
  return card.getBoundingClientRect()
}

export function centerOf(rect: DOMRect): Readonly<{ x: number; y: number }> | null {
  if (rect.width === 0 && rect.height === 0) return null
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/** Viewport rect of a reward/shop loot pickup image inside its button. */
export function lootPickupViewportRect(el: HTMLElement): DOMRect {
  const img = el.querySelector<HTMLElement>('img') ?? el
  return img.getBoundingClientRect()
}

/** Viewport anchor for loot-pickup burst FX (e.g. gold bag), nudged toward the opening. */
export function lootPickupBurstViewportCenter(
  sourceEl: HTMLElement,
  abovePx = 30,
): Readonly<{ x: number; y: number }> | null {
  const center = centerOf(lootPickupViewportRect(sourceEl))
  if (!center) return null
  return { x: center.x, y: center.y - abovePx }
}

/** Viewport anchor for cast-star FX: center of the visible card, nudged slightly upward. */
export function cardCastBurstViewportCenter(
  sourceEl: HTMLElement,
  abovePx = 68,
): Readonly<{ x: number; y: number }> | null {
  const center = centerOf(cardViewportRect(sourceEl))
  if (!center) return null
  return { x: center.x, y: center.y - abovePx }
}

/** Precise viewport center of the deck inspect PNG. */
export function deckInspectImageCenter(img: HTMLImageElement): Readonly<{ x: number; y: number }> | null {
  return centerOf(img.getBoundingClientRect())
}

/** Card pickup flight endpoints in game-stage local coordinates. */
export function cardDeckTravelEndpoints(
  stageLayer: HTMLElement,
  sourceEl: HTMLElement,
  deckImg: HTMLImageElement,
): Readonly<{ from: { x: number; y: number }; to: { x: number; y: number } }> | null {
  const toViewport = deckInspectImageCenter(deckImg)
  const fromViewport = centerOf(cardViewportRect(sourceEl))
  if (!toViewport || !fromViewport) return null

  return {
    from: viewportPointRelativeTo(stageLayer, fromViewport.x, fromViewport.y),
    to: viewportPointRelativeTo(stageLayer, toViewport.x, toViewport.y),
  }
}

/** Card draw flight endpoints: deck inspect PNG → hand slot (game-stage local). */
export function cardHandTravelEndpoints(
  stageLayer: HTMLElement,
  deckImg: HTMLImageElement,
  handSlotEl: HTMLElement,
): Readonly<{ from: { x: number; y: number }; to: { x: number; y: number } }> | null {
  const toViewport = centerOf(cardViewportRect(handSlotEl))
  if (!toViewport) return null
  return cardPullFromDeckEndpointsFromViewport(stageLayer, deckImg, toViewport)
}

/**
 * Pull-from-deck flight endpoints: deck inspect PNG → target center (game-stage local).
 * `target` is the landing center in the same coordinate space as `--travel-x` / `--travel-y`.
 */
export function cardPullFromDeckEndpoints(
  stageLayer: HTMLElement,
  deckImg: HTMLImageElement,
  target: Readonly<{ x: number; y: number }>,
): Readonly<{ from: { x: number; y: number }; to: { x: number; y: number } }> | null {
  const fromViewport = deckInspectImageCenter(deckImg)
  if (!fromViewport) return null

  return {
    from: viewportPointRelativeTo(stageLayer, fromViewport.x, fromViewport.y),
    to: target,
  }
}

/** Pull-from-deck endpoints when the target center is in viewport coordinates. */
export function cardPullFromDeckEndpointsFromViewport(
  stageLayer: HTMLElement,
  deckImg: HTMLImageElement,
  targetViewport: Readonly<{ x: number; y: number }>,
): Readonly<{ from: { x: number; y: number }; to: { x: number; y: number } }> | null {
  return cardPullFromDeckEndpoints(
    stageLayer,
    deckImg,
    viewportPointRelativeTo(stageLayer, targetViewport.x, targetViewport.y),
  )
}

/** Viewport center for the discard pile inspect PNG. */
export function discardInspectImageCenter(img: HTMLImageElement): Readonly<{ x: number; y: number }> | null {
  return centerOf(img.getBoundingClientRect())
}

/** Card discard flight endpoints: hand slot → discard inspect PNG (game-stage local). */
export function cardDiscardTravelEndpoints(
  stageLayer: HTMLElement,
  discardImg: HTMLImageElement,
  source: Readonly<{ el?: HTMLElement; rect?: DOMRect }>,
): Readonly<{ from: { x: number; y: number }; to: { x: number; y: number } }> | null {
  const fromViewport = source.el
    ? centerOf(cardViewportRect(source.el))
    : source.rect
      ? centerOf(source.rect)
      : null
  const toViewport = discardInspectImageCenter(discardImg)
  if (!fromViewport || !toViewport) return null

  return {
    from: viewportPointRelativeTo(stageLayer, fromViewport.x, fromViewport.y),
    to: viewportPointRelativeTo(stageLayer, toViewport.x, toViewport.y),
  }
}
