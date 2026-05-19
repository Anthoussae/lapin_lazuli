import type { CardRewardState } from '../../core/types/state'

export function isRewardLootFullyCollected(rw: CardRewardState): boolean {
  return (rw.goldEarned <= 0 || rw.goldPickedUp) && (rw.keysEarned <= 0 || rw.keysPickedUp)
}

export function initialRewardLootFlags(
  goldEarned: number,
  keysEarned: number,
): Readonly<{ goldPickedUp: boolean; keysPickedUp: boolean }> {
  return { goldPickedUp: goldEarned <= 0, keysPickedUp: keysEarned <= 0 }
}
