/** Viewport bounds of the fixed-size game window (`.stageFrame`). */
export function gameWindowBounds(): DOMRect | null {
  return document.querySelector('.stageFrame')?.getBoundingClientRect() ?? null
}

/** Nudge a positioned tooltip element so its painted box stays inside the game window. */
export function clampElementToGameWindow(el: HTMLElement, padding: number): void {
  const bounds = gameWindowBounds()
  if (!bounds) return

  const rect = el.getBoundingClientRect()
  let dx = 0
  let dy = 0

  if (rect.left < bounds.left + padding) {
    dx = bounds.left + padding - rect.left
  } else if (rect.right > bounds.right - padding) {
    dx = bounds.right - padding - rect.right
  }

  if (rect.top < bounds.top + padding) {
    dy = bounds.top + padding - rect.top
  } else if (rect.bottom > bounds.bottom - padding) {
    dy = bounds.bottom - padding - rect.bottom
  }

  if (dx === 0 && dy === 0) return

  const currentLeft = Number.parseFloat(el.style.left) || 0
  const currentTop = Number.parseFloat(el.style.top) || 0
  el.style.left = `${currentLeft + dx}px`
  el.style.top = `${currentTop + dy}px`
}
