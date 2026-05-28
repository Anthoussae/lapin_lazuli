import type { CardId, EnchantmentId } from '../core/types/ids'

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
  /**
   * HP loss (not damage): ignores temporary shield and locked shield.
   * `target` defaults to selectedEnemy (for combat cards); `player` is supported for effects/relics.
   */
  | ({ kind: 'HP_LOSS'; amount: number; target?: 'player' | 'selectedEnemy' } & EffectUpgrade)
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
  /** Gain `ceil(playerGold * percentAmount / 100)` gold (relic interest). */
  | ({ kind: 'GAIN_INTEREST'; percentAmount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_KEYS'; amount: number } & EffectUpgrade)
  /** `duration: 'combat'` bonuses are cleared when the fight ends; default is permanent. */
  | ({ kind: 'GAIN_POWER'; amount: number; duration?: 'permanent' | 'combat' } & EffectUpgrade)
  /** `duration: 'combat'` bonuses are cleared when the fight ends; default is permanent. */
  | ({ kind: 'GAIN_SHIELD_POWER'; amount: number; duration?: 'permanent' | 'combat' } & EffectUpgrade)
  /** `duration: 'combat'` bonuses are cleared when the fight ends; default is permanent. */
  | ({ kind: 'GAIN_FIREPOWER'; amount: number; duration?: 'permanent' | 'combat' } & EffectUpgrade)
  | ({ kind: 'GAIN_FIREPOWER_MULTIPLIER'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_LUCK'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_INK'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_MAX_INK'; amount: number } & EffectUpgrade)
  | ({ kind: 'GAIN_HAND_SIZE'; amount: number } & EffectUpgrade)
  /** Backpack: at combat start, gain all powers per burden owned (combat only). */
  | ({ kind: 'GAIN_ALL_POWERS_PER_OWNED_BURDEN' } & EffectUpgrade)
  /** Copper Alembics: add one random un-upgraded potion to hand with Expire (combat only). */
  | ({ kind: 'ADD_RANDOM_POTION_TO_HAND' } & EffectUpgrade)
  /** Phoenix-feather Quill: fire spells cost 0 ink until the player casts one (combat only). */
  | ({ kind: 'ACTIVATE_FREE_FIRST_FIRE_SPELL' } & EffectUpgrade)
  /** Paintbrush: the next spell cast costs 0 ink (combat only). */
  | ({ kind: 'NEXT_SPELL_COSTS_0' } & EffectUpgrade)
  | ({ kind: 'UPGRADE_SELECTED_CARD'; numberOfTargets: number; upgradeAmount: number } & EffectUpgrade)
  | ({ kind: 'CONSUME_SELECTED_CARD'; numberOfTargets: number } & EffectUpgrade)
  | ({ kind: 'UPGRADE_SPECIFIC_CARD'; target: CardId; numberOfTargets: number; upgradeAmount: number } & EffectUpgrade)
  | ({ kind: 'UPGRADE_RANDOM_DECK_CARDS'; numberOfTargets: number; upgradeAmount: number } & EffectUpgrade)
  /** At combat start, put this card in your opening hand (not a draw; ignores hand-size modifiers). */
  | ({ kind: 'DESTINY' } & EffectUpgrade)
  /** On play, permanently remove this card from the deck. */
  | ({ kind: 'CONSUME' } & EffectUpgrade)
  /** After this card is played, it cannot be played again this combat. */
  | ({ kind: 'EXHAUST' } & EffectUpgrade)
  /** After this card's other effects resolve, upgrade it once. */
  | ({ kind: 'UPGRADE_AFTER_CASTING' } & EffectUpgrade)
  /**
   * Apply an enchantment to a combat target. When `amount` is present, it overrides the enchantment's
   * base amount(s) for gameplay calculations; upgrades scale this effect normally via `upgradeValue`.
   */
  | ({ kind: 'APPLY_ENCHANTMENT'; enchantmentId: EnchantmentId; target: 'self' | 'opponent' | 'global'; amount?: number } & EffectUpgrade)
  /** Randomly remove `amount` enchantment instances owned by your opponent. */
  | ({ kind: 'DISPEL'; amount: number } & EffectUpgrade)
