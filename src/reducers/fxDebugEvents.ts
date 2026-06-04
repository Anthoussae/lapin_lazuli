import type { GameEvent } from './events'
import { eventToString } from './events'

const POISON_FX_LINE_RE = /^(ENCHANTMENT POISON |POISON_CARD_HP_LOSS )/
const FIRE_FX_LINE_RE = /^FIRE_DAMAGE_RECEIVED /

/** Debug lines that drive poison combat FX (must not be dropped from action batches). */
export function isPoisonFxDebugLine(line: string): boolean {
  return POISON_FX_LINE_RE.test(line)
}

/** Debug lines that drive fire damage combat FX (must not be dropped from action batches). */
export function isFireFxDebugLine(line: string): boolean {
  return FIRE_FX_LINE_RE.test(line)
}

const FX_DEBUG_TAIL_COUNT = 8

/**
 * Builds `ui.debug.lastEvents`: all poison and fire FX lines from the full batch (in order, including
 * duplicates for multi-stack ticks), plus recent tail lines for other FX listeners.
 */
export function buildDebugLastEvents(events: ReadonlyArray<GameEvent>): ReadonlyArray<string> {
  const all = events.map(eventToString)
  const preservedFx = all.filter((line) => isPoisonFxDebugLine(line) || isFireFxDebugLine(line))
  const out: string[] = [...preservedFx]
  const seen = new Set(preservedFx)
  for (const line of all.slice(-FX_DEBUG_TAIL_COUNT)) {
    if (seen.has(line)) continue
    seen.add(line)
    out.push(line)
  }
  return out
}
