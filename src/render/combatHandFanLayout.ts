import type { CSSProperties } from 'react'

/** Horizontal overlap between adjacent hand cards (px). */
export const HAND_FAN_OVERLAP_PX = 36

/** Rotation per slot away from hand center (degrees). */
export const HAND_FAN_DEG_PER_SLOT = 4

/** At or below this count, the hand uses default overlap and rotation. */
export const HAND_FAN_UNCOMPRESSED_MAX_COUNT = 7

/** Card width (px); keep in sync with `--game-card-w` in tokens.css. */
export const HAND_FAN_CARD_WIDTH_PX = 134

/** Minimum visible width per card when compressing a large hand (px). */
const HAND_FAN_MIN_VISIBLE_CARD_PX = 12

export type CombatHandFanMetrics = Readonly<{
  overlapPx: number
  degPerSlot: number
}>

/** Horizontal span of the fanned hand (px), ignoring rotation spill. */
export function combatHandFanSpanPx(
  count: number,
  overlapPx: number,
  cardWidthPx = HAND_FAN_CARD_WIDTH_PX,
): number {
  if (count <= 0) return 0
  if (count === 1) return cardWidthPx
  return cardWidthPx + (count - 1) * (cardWidthPx - overlapPx)
}

function referenceUncompressedSpanPx(cardWidthPx = HAND_FAN_CARD_WIDTH_PX): number {
  return combatHandFanSpanPx(HAND_FAN_UNCOMPRESSED_MAX_COUNT, HAND_FAN_OVERLAP_PX, cardWidthPx)
}

/** Tighter overlap and gentler fan when {@link HAND_FAN_UNCOMPRESSED_MAX_COUNT} is exceeded. */
export function combatHandFanMetrics(count: number): CombatHandFanMetrics {
  if (count <= HAND_FAN_UNCOMPRESSED_MAX_COUNT) {
    return { overlapPx: HAND_FAN_OVERLAP_PX, degPerSlot: HAND_FAN_DEG_PER_SLOT }
  }

  const cardW = HAND_FAN_CARD_WIDTH_PX
  const targetSpan = referenceUncompressedSpanPx(cardW)
  const overlapPx = Math.min(
    cardW - HAND_FAN_MIN_VISIBLE_CARD_PX,
    cardW - (targetSpan - cardW) / (count - 1),
  )
  const degPerSlot = (HAND_FAN_DEG_PER_SLOT * HAND_FAN_UNCOMPRESSED_MAX_COUNT) / count

  return { overlapPx, degPerSlot }
}

/** CSS variables for `.handRow.handFan` based on hand size. */
export function combatHandFanContainerStyle(count: number): CSSProperties {
  const { overlapPx, degPerSlot } = combatHandFanMetrics(count)
  return {
    '--hand-fan-overlap': `${overlapPx}px`,
    '--hand-fan-deg-per-slot': `${degPerSlot}deg`,
  } as CSSProperties
}

/** Hover scale for a highlighted hand card. */
export const HAND_FAN_HIGHLIGHT_SCALE = 1.2

/** Vertical lift at fan center (px, applied as negative translateY). */
export const HAND_FAN_ARC_LIFT_CENTER_PX = 18

/** Vertical lift at fan edges (px, applied as negative translateY). */
export const HAND_FAN_ARC_LIFT_EDGE_PX = 3

function maxOffsetFromCenter(count: number): number {
  const center = (count - 1) / 2
  let max = 0
  for (let i = 0; i < count; i++) max = Math.max(max, Math.abs(i - center))
  return max
}

/** Quadratic arc: center cards rise most, edge cards least. */
export function combatHandFanArcLiftPx(index: number, count: number): number {
  if (count <= 1) return -HAND_FAN_ARC_LIFT_CENTER_PX

  const center = (count - 1) / 2
  const maxOffset = maxOffsetFromCenter(count)
  const distNorm = maxOffset === 0 ? 0 : Math.abs(index - center) / maxOffset
  const arcFactor = 1 - distNorm * distNorm
  const lift =
    HAND_FAN_ARC_LIFT_EDGE_PX + arcFactor * (HAND_FAN_ARC_LIFT_CENTER_PX - HAND_FAN_ARC_LIFT_EDGE_PX)
  return -lift
}

export type HandFanSlotStacking = Readonly<{
  exhausted?: boolean
}>

function countExhaustedSlots(slots: ReadonlyArray<HandFanSlotStacking>): number {
  return slots.filter((slot) => slot.exhausted).length
}

/** Exhausted cards stack below all non-exhausted cards; order preserved within each group. */
export function combatHandFanZIndex(slots: ReadonlyArray<HandFanSlotStacking>, index: number): number {
  const exhaustedCount = countExhaustedSlots(slots)
  if (slots[index]?.exhausted) {
    let rank = 0
    for (let i = 0; i <= index; i++) if (slots[i]?.exhausted) rank++
    return rank
  }
  let rank = 0
  for (let i = 0; i <= index; i++) if (!slots[i]?.exhausted) rank++
  return exhaustedCount + rank
}

/** Hover lifts within group; exhausted hover stays below non-exhausted cards. */
export function combatHandFanHoverZIndex(slots: ReadonlyArray<HandFanSlotStacking>, index: number): number {
  const exhaustedCount = countExhaustedSlots(slots)
  if (slots[index]?.exhausted) return Math.max(1, exhaustedCount)
  return 100
}

export function combatHandFanSlotStyle(
  index: number,
  count: number,
  slots: ReadonlyArray<HandFanSlotStacking>,
): CSSProperties {
  if (count <= 0) return {}

  const center = (count - 1) / 2
  const offset = index - center
  const { degPerSlot } = combatHandFanMetrics(count)
  const rotateDeg = count === 1 ? 0 : offset * degPerSlot
  const liftPx = combatHandFanArcLiftPx(index, count)

  return {
    '--hand-fan-rotate': `${rotateDeg}deg`,
    '--hand-fan-lift': `${liftPx}px`,
    '--hand-fan-z': String(combatHandFanZIndex(slots, index)),
    '--hand-fan-hover-z': String(combatHandFanHoverZIndex(slots, index)),
  } as CSSProperties
}
