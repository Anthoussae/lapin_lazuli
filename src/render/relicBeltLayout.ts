import {
  RELIC_BELT_ICON_WIDTH_PX,
  RELIC_BELT_ROW_GAP_PX,
  relicBeltFanSlotStepPx,
  relicBeltUsesFanLayout,
} from './relicBeltFanLayout'

/** Keep in sync with `--relic-icon-height` in tokens.css (72px × 1.3). */
const DEFAULT_ICON_SIZE_PX = RELIC_BELT_ICON_WIDTH_PX

/** Map a viewport rect into an ancestor's local coordinate space (e.g. the game stage layer). */
export function rectRelativeTo(root: HTMLElement, rect: DOMRect): DOMRect {
  const rootRect = root.getBoundingClientRect()
  return new DOMRect(rect.left - rootRect.left, rect.top - rootRect.top, rect.width, rect.height)
}

/** Map a viewport point into an ancestor's local coordinate space (accounts for stage scale/transform). */
export function viewportPointRelativeTo(
  root: HTMLElement,
  viewportX: number,
  viewportY: number,
): Readonly<{ x: number; y: number }> {
  const rootRect = root.getBoundingClientRect()
  return { x: viewportX - rootRect.left, y: viewportY - rootRect.top }
}

/** The `.relicIcon` inside a slot/button, or the element itself when already an icon. */
export function relicIconElement(el: HTMLElement): HTMLElement {
  if (el.classList.contains('relicIcon')) return el
  return el.querySelector<HTMLElement>('.relicIcon') ?? el
}

export function relicIconViewportRect(el: HTMLElement): DOMRect {
  return relicIconElement(el).getBoundingClientRect()
}

/** Target screen rect for a belt slot (existing, in-flight pending, or next append position). */
export function getBeltSlotRect(beltRow: HTMLElement, slotIndex: number): DOMRect {
  const pending = beltRow.querySelector<HTMLElement>(
    `[data-relic-belt-slot="${slotIndex}"][data-relic-belt-pending]`,
  )
  if (pending) return relicIconViewportRect(pending)

  const slots = beltRow.querySelectorAll<HTMLElement>(
    '[data-relic-belt-slot]:not([data-relic-belt-pending])',
  )
  if (slotIndex < slots.length) {
    return relicIconViewportRect(slots[slotIndex]!)
  }

  const rowRect = beltRow.getBoundingClientRect()

  if (slots.length === 0) {
    return new DOMRect(
      rowRect.left + rowRect.width / 2 - DEFAULT_ICON_SIZE_PX / 2,
      rowRect.top + Math.max(0, (rowRect.height - DEFAULT_ICON_SIZE_PX) / 2),
      DEFAULT_ICON_SIZE_PX,
      DEFAULT_ICON_SIZE_PX,
    )
  }

  const last = relicIconViewportRect(slots[slots.length - 1]!)
  const totalCount = Math.max(slotIndex + 1, slots.length + 1)
  if (relicBeltUsesFanLayout(totalCount)) {
    const stepPx = relicBeltFanSlotStepPx(totalCount, beltRowInnerWidthPx(beltRow))
    return new DOMRect(last.left + stepPx, last.top, last.width, last.height)
  }
  return new DOMRect(last.right + RELIC_BELT_ROW_GAP_PX, last.top, last.width, last.height)
}

function beltRowInnerWidthPx(beltRow: HTMLElement): number | undefined {
  const style = getComputedStyle(beltRow)
  const paddingX =
    (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
  const inner = beltRow.clientWidth - paddingX
  return inner > 0 ? inner : undefined
}

