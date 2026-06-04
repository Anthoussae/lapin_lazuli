import type { EnemyInstanceId, EnchantmentId, EnchantmentInstanceId } from './ids'

export type EnchantmentOwner = Readonly<{ kind: 'PLAYER' } | { kind: 'ENEMY'; enemyInstanceId: EnemyInstanceId }>

export type EnchantmentTarget = 'self' | 'opponent' | 'global'

export type EnchantmentDuration = 'combat'

export type EnchantmentTrigger = 'onTargetTurnStart' | 'onTakingDamage'

export type IncomingDamageType = 'BUNNY' | 'FIRE' | 'POISON'

export type EnchantmentEffect =
  | Readonly<{ kind: 'ADD_POWER'; amount: number }>
  | Readonly<{ kind: 'ADD_FIREPOWER'; amount: number }>
  | Readonly<{ kind: 'ADD_SHIELD_POWER'; amount: number }>
  | Readonly<{ kind: 'GAIN_SHIELD'; amount: number }>
  | Readonly<{ kind: 'GAIN_MAX_HP'; amount: number }>
  /**
   * HP loss (not damage): ignores temporary shield and locked shield.
   * Intended for poison-like effects.
   */
  | Readonly<{ kind: 'HP_LOSS'; amount: number }>
  | Readonly<{ kind: 'DEAL_DAMAGE'; amount: number }>
  /** Multiplicative per stack; applied after damage buffs (see {@link applyIncomingDamageReduction}). */
  | Readonly<{ kind: 'REDUCE_INCOMING_DAMAGE'; damageType: IncomingDamageType; percent: number }>
  /** Additive per stack; applied before typed resists (see {@link applyIncomingDamageAmplification}). */
  | Readonly<{ kind: 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS'; percent: number }>
  /** Applied to outgoing damage/HP loss from the enchanted unit; result rounded up (see {@link applyOutgoingDamageAndHpLossModifiers}). */
  | Readonly<{ kind: 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS'; percent: number }>
  /** Reduces cards drawn each combat hand refresh (per stack); draw count floors at 1. */
  | Readonly<{ kind: 'REDUCE_HAND_DRAW'; amount: number }>
  /** Reduces shield and locked-shield gains (per stack); gain amount floors at 0. */
  | Readonly<{ kind: 'DECREASE_SHIELD_POWER'; amount: number }>

export type EnchantmentAbility =
  | Readonly<{ kind: 'STATIC'; effects: ReadonlyArray<EnchantmentEffect> }>
  | Readonly<{
      kind: 'TRIGGERED'
      trigger: EnchantmentTrigger
      effects: ReadonlyArray<EnchantmentEffect>
    }>
  /** No automatic effects; gameplay handled elsewhere (e.g. Bubble damage prevention). */
  | Readonly<{ kind: 'PASSIVE' }>

/** PNG overlay on the combat placeholder center (see tokens.css --enchantment-*-*). */
export type EnchantmentSpriteOverlayId = 'BUBBLE' | 'ANTI_MAGIC_SHELL' | 'POISON' | 'FIRE_CROWN'

export type EnchantmentRender = Readonly<{
  kind: 'SPRITE_OVERLAY'
  sprite: EnchantmentSpriteOverlayId
}>

export type EnchantmentTemplate = Readonly<{
  id: EnchantmentId
  name: string
  /** CSS color string for glow ring render; omit when using {@link render} only. */
  color?: string
  /** Sprite overlay at placeholder center; used instead of or without a glow ring. */
  render?: EnchantmentRender
  tooltipText: string
  tags: ReadonlyArray<string>
  target: EnchantmentTarget
  duration: EnchantmentDuration
  ability: EnchantmentAbility
  /** When false, re-applying the same enchantment to the same target does nothing. */
  stackable?: boolean
}>

export type EnchantmentTargetRef =
  | Readonly<{ kind: 'PLAYER' }>
  | Readonly<{ kind: 'ENEMY'; enemyInstanceId: EnemyInstanceId }>
  | Readonly<{ kind: 'GLOBAL' }>

export type EnchantmentInstance = Readonly<{
  id: EnchantmentInstanceId
  templateId: EnchantmentId
  owner: EnchantmentOwner
  target: EnchantmentTargetRef
  /**
   * Optional numeric override for abilities that use a single primary amount.
   * When present, this replaces the template's amount(s) for gameplay calculations.
   */
  amountOverride?: number
}>

