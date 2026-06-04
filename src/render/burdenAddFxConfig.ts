import { hash01 } from './bunnyLeapPath'
import { readRootDurationMs, readRootPxVar } from './relicTooltipPosition'

/** Combat burden add FX (see tokens.css --burden-* / --duration-burden-*). */
export const BURDEN_ADD_FX_TOKEN = {
  /** Phase 1 — burden card appears on screen before travel begins. */
  appearance: '--duration-burden-appearance',
  /** Phase 1 — glow burst (`burdenAddEffect.png`) fade behind the card. */
  effectFade: '--duration-burden-add-effect-fade',
  effectSize: '--burden-add-effect-size',
  /** Phase 1 — burden card opacity fade-in. */
  cardFadeIn: '--duration-burden-add-card-fade-in',
  /** Phase 2 — flip face-up at the preview slot. */
  addToDeckFlip: '--duration-burden-add-to-deck-flip',
  /** Phase 2 — travel from preview slot into the deck (or discard pile). */
  addToDeckTravel: '--duration-burden-add-to-deck-travel',
  /** Gap after flip before travel starts (matches CardTravelProvider timer). */
  addToDeckFlipBuffer: '--duration-burden-add-to-deck-flip-buffer',
  /** Safety buffer after travel completes. */
  addToDeckFinishBuffer: '--duration-burden-add-to-deck-finish-buffer',
  /** Delay between each burden's appearance start (0, 1×, 2×, …). */
  stagger: '--duration-burden-add-stagger',
  spawnX: '--burden-add-spawn-x',
  spawnY: '--burden-add-spawn-y',
  spawnOffsetMin: '--burden-add-spawn-offset-min',
  spawnOffsetMax: '--burden-add-spawn-offset-max',
  cardScale: '--burden-add-card-scale',
  cardZ: '--burden-add-card-z-index',
} as const

export function burdenAppearanceMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.appearance) || 700
}

export function burdenAddEffectFadeMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.effectFade) || 700
}

export function burdenAddEffectSizePx(): number {
  return readRootPxVar(BURDEN_ADD_FX_TOKEN.effectSize) || 420
}

export function burdenAddCardFadeInMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.cardFadeIn) || 280
}

export function burdenAddToDeckFlipMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.addToDeckFlip) || 450
}

export function burdenAddToDeckTravelMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.addToDeckTravel) || 500
}

export function burdenAddToDeckFlipBufferMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.addToDeckFlipBuffer) || 40
}

export function burdenAddToDeckFinishBufferMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.addToDeckFinishBuffer) || 120
}

/** Wall-clock duration for phase 2 (flip → travel → buffer). */
export function burdenAddToDeckTotalMs(): number {
  return (
    burdenAddToDeckFlipMs() +
    burdenAddToDeckFlipBufferMs() +
    burdenAddToDeckTravelMs() +
    burdenAddToDeckFinishBufferMs()
  )
}

export function burdenAddStaggerMs(): number {
  return readRootDurationMs(BURDEN_ADD_FX_TOKEN.stagger) || 150
}

export function burdenAddSpawnOffsetMinPx(): number {
  return readRootPxVar(BURDEN_ADD_FX_TOKEN.spawnOffsetMin) || 50
}

export function burdenAddSpawnOffsetMaxPx(): number {
  return readRootPxVar(BURDEN_ADD_FX_TOKEN.spawnOffsetMax) || 100
}

/** Pixel offset from the spawn anchor; first burden in a batch stays centered. */
export function burdenAddSpawnOffsetForEntry(
  entryId: string,
  orderIndex: number,
): Readonly<{ x: number; y: number }> {
  if (orderIndex <= 0) return { x: 0, y: 0 }

  const seed = Number.parseInt(entryId.replace(/\D/g, ''), 10) || 0
  const min = burdenAddSpawnOffsetMinPx()
  const max = burdenAddSpawnOffsetMaxPx()
  const span = Math.max(0, max - min)
  const magX = min + hash01(seed, 11) * span
  const magY = min + hash01(seed, 13) * span
  const signX = hash01(seed, 17) < 0.5 ? -1 : 1
  const signY = hash01(seed, 19) < 0.5 ? -1 : 1
  return { x: signX * magX, y: signY * magY }
}
