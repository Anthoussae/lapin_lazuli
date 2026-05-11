import type { CardId } from '../core/types/ids'

export type Effect =
  | { kind: 'DRAW_CARDS'; amount: number }
  | { kind: 'ADD_BUNNIES'; amount: number }
  /** Multiplier applied to current bunnies; result is rounded up. Amount increases by 0.5 per card upgrade (e.g. Multibunnies). */
  | { kind: 'MULTIPLY_BUNNIES'; amount: number }
  | { kind: 'HEAL'; amount: number }
  /** Temporary combat shield; `target` defaults to player. `selectedEnemy` uses {@link CombatState.targeting}. */
  | { kind: 'GAIN_SHIELD'; amount: number; target?: 'player' | 'selectedEnemy' }
  /** Locked shield for the player; not cleared at turn start. */
  | { kind: 'GAIN_LOCKED_SHIELD'; amount: number }
  /** Move all temporary player shield into locked shield. */
  | { kind: 'LOCK_ALL_SHIELD' }
  /** Direct damage to the selected enemy (shield first); resolved on card play. */
  | { kind: 'DEAL_DAMAGE'; amount: number }
  | { kind: 'GAIN_MAX_HP'; amount: number }
  | { kind: 'GAIN_GOLD'; amount: number }
  | { kind: 'GAIN_KEYS'; amount: number }
  | { kind: 'GAIN_POWER'; amount: number }
  | { kind: 'GAIN_FIREPOWER_MULTIPLIER'; amount: number }
  | { kind: 'GAIN_LUCK'; amount: number }
  | { kind: 'GAIN_INK'; amount: number }
  | { kind: 'GAIN_MAX_INK'; amount: number }
  | { kind: 'UPGRADE_SELECTED_CARD'; numberOfTargets: number; upgradeAmount: number }
  | { kind: 'CONSUME_SELECTED_CARD'; numberOfTargets: number }
  | { kind: 'UPGRADE_SPECIFIC_CARD'; target: CardId; numberOfTargets: number; upgradeAmount: number }
  /** At combat start, put this card in your opening hand (not a draw; ignores hand-size modifiers). */
  | { kind: 'DESTINY' }
  /** On play, permanently remove this card from the deck. */
  | { kind: 'CONSUME' }
  /** After this card is played, it cannot be played again this combat. */
  | { kind: 'EXHAUST' }
  /** After this card's other effects resolve, upgrade it once. */
  | { kind: 'UPGRADE_AFTER_CASTING' }
  /** At player turn end, permanently remove this card if it is still in hand. */
  | { kind: 'CONSUME_IF_IN_HAND_AT_TURN_END' }
