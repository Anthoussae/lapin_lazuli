import { readRootDurationMs } from './relicTooltipPosition'

/** Path iris-out tokens (see tokens.css). */
export const PATH_IRIS_OUT_TOKEN = {
  colorDuration: '--duration-iris-path-out-color',
  clearDuration: '--duration-iris-path-out-clear',
  secondDelay: '--iris-second-path-delay',
} as const

const FALLBACK_MS = 1000
const FALLBACK_SECOND_DELAY_MS = 500

export function pathIrisOutColorDurationMs(): number {
  return readRootDurationMs(PATH_IRIS_OUT_TOKEN.colorDuration) || FALLBACK_MS
}

export function pathIrisOutClearDurationMs(): number {
  return readRootDurationMs(PATH_IRIS_OUT_TOKEN.clearDuration) || FALLBACK_MS
}

export function pathIrisSecondPathDelayMs(): number {
  return readRootDurationMs(PATH_IRIS_OUT_TOKEN.secondDelay) || FALLBACK_SECOND_DELAY_MS
}
