import type { CardId } from '../core/types/ids'

/**
 * Added to an effect's numeric fields per card-instance upgrade counter
 * ({@link applyCardInstanceEffectModifiers}). Omit or `0` when the effect does not scale.
 * Foiled cards apply +50% (rounded up) to `upgradeValue` before scaling and to `amount` after.
 */
export type EffectUpgrade = Readonly<{ upgradeValue?: number }>

export type Effect =
  | ({ kind: 'DRAW_CARDS'; amount: number } & EffectUpgrade)
  | ({ kind: 'ADD_BUNNIES'; amount: number } & EffectUpgrade)
  /** Multiplier applied to current bunnies; result is rounded up. Scales via `upgradeValue`. */
  | ({ kind: 'MULTIPLY_BUNNIES'; amount: number } & EffectUpgrade)
  | ({ kind: 'HEAL'; amount: number } & EffectUpgrade)
  /** Temporary combat shield; `target` defaults to player. `selectedEnemy` uses {@link CombatState.targeting}. */
  | ({ kind: 'GAIN_SHIELD'; amount: number; target?: 'player' | 'selectedEnemy' } & EffectUpgrade)
  /** Temporary shield equal to {@link GameState.level} (relics). */
  | ({ kind: 'GAIN_SHIELD_EQUAL_TO_LEVEL' } & EffectUpgrade)
  /** Locked shield for the player; not cleared at turn start. */
  | ({ kind: 'GAIN_LOCKED_SHIELD'; amount: number } & EffectUpgrade)
  /** Move all temporary player shield into locked shield. */
  | ({ kind: 'LOCK_ALL_SHIELD' } & EffectUpgrade)
  /** Direct damage to the selected enemy (shield first); resolved on card play. */
  | ({ kind: 'DEAL_DAMAGE'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_MAX_HP'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_GOLD'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_KEYS'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_POWER'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_SHIELD_POWER'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_FIREPOWER_MULTIPLIER'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_LUCK'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_INK'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_MAX_INK'; amount: number } & EffectUpgrade)
  /** Phoenix-feather Quill: fire spells cost 0 ink until the player casts one (combat only). */
  | ({ kind: 'ACTIVATE_FREE_FIRST_FIRE_SPELL' } & EffectUpgrade)
  | ({ kind: 'UPGRADE_SELECTED_CARD'; numberOfTargets: number; upgradeAmount: number } & EffectUpgrade)
  | ({ kind: 'CONSUME_SELECTED_CARD'; numberOfTargets: number } & EffectUpgrade)
  | ({ kind: 'UPGRADE_SPECIFIC_CARD'; target: CardId; numberOfTargets: number; upgradeAmount: number } & EffectUpgrade)
  /** At combat start, put this card in your opening hand (not a draw; ignores hand-size modifiers). */
  | ({ kind: 'DESTINY' } & EffectUpgrade)
  /** On play, permanently remove this card from the deck. */
  | ({ kind: 'CONSUME' } & EffectUpgrade)
  /** After this card is played, it cannot be played again this combat. */
  | ({ kind: 'EXHAUST' } & EffectUpgrade)
  /** After this card's other effects resolve, upgrade it once. */
  | ({ kind: 'UPGRADE_AFTER_CASTING' } & EffectUpgrade)
  /** At player turn end, permanently remove this card if it is still in hand. */
  | ({ kind: 'CONSUME_IF_IN_HAND_AT_TURN_END' } & EffectUpgrade)
