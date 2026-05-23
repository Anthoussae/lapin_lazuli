import { readRootDurationMs } from './relicTooltipPosition'

/** CSS custom property for the open-door beat before path advance (see tokens.css). */
export const PATH_DOOR_OPEN_TOKEN = {
  duration: '--duration-path-door-open',
} as const

const FALLBACK_MS = 350

export function pathDoorOpenDurationMs(): number {
  return readRootDurationMs(PATH_DOOR_OPEN_TOKEN.duration) || FALLBACK_MS
}
