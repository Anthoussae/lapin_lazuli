import { centerOf } from './cardLayout'
import type { IrisCenter } from './primitives/IrisOverlay'
import { readRootPxVar } from './relicTooltipPosition'

function pathIrisSlotNudgePx(slotIndex: number, slotCount: number): Readonly<{ x: number; y: number }> {
  const centerX = readRootPxVar('--iris-path-center-x-offset')
  const centerY = readRootPxVar('--iris-path-center-y-offset')

  if (slotCount <= 1) {
    return { x: centerX, y: centerY }
  }

  if (slotIndex === 0) {
    return {
      x: centerX + readRootPxVar('--iris-path-left-center-x-offset'),
      y: centerY + readRootPxVar('--iris-path-left-center-y-offset'),
    }
  }

  if (slotIndex === slotCount - 1) {
    return {
      x: centerX + readRootPxVar('--iris-path-right-center-x-offset'),
      y: centerY + readRootPxVar('--iris-path-right-center-y-offset'),
    }
  }

  return { x: centerX, y: centerY }
}

/** Door art center as % of the stage layer (for path iris anchor). */
export function pathIrisCenterFromDoor(
  stageLayer: HTMLElement,
  doorButton: HTMLElement,
  slotIndex: number,
  slotCount: number,
): IrisCenter | null {
  const art = doorButton.querySelector<HTMLElement>('.pathDoor__art')
  if (!art) return null

  const stageRect = stageLayer.getBoundingClientRect()
  if (stageRect.width <= 0 || stageRect.height <= 0) return null

  const c = centerOf(art.getBoundingClientRect())
  if (!c) return null

  const { x: nudgeX, y: nudgeY } = pathIrisSlotNudgePx(slotIndex, slotCount)

  return {
    xPercent: ((c.x - stageRect.left + nudgeX) / stageRect.width) * 100,
    yPercent: ((c.y - stageRect.top + nudgeY) / stageRect.height) * 100,
  }
}
