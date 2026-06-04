import { readRootDurationMs } from './relicTooltipPosition'

/** HP bar tick-down before monster/player knockout FX (see tokens.css). */
export const LETHAL_HP_DRAIN_TOKEN = {
  duration: '--duration-lethal-hp-drain-before-knockout',
  ticking: '--duration-ticking-number',
} as const

export function lethalHpDrainBeforeKnockoutMs(): number {
  return (
    readRootDurationMs(LETHAL_HP_DRAIN_TOKEN.duration) ||
    readRootDurationMs(LETHAL_HP_DRAIN_TOKEN.ticking) ||
    400
  )
}
