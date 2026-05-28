import type { EnemyInstanceId, EnchantmentId, EnchantmentInstanceId } from './ids'

export type EnchantmentOwner = Readonly<{ kind: 'PLAYER' } | { kind: 'ENEMY'; enemyInstanceId: EnemyInstanceId }>

export type EnchantmentTarget = 'self' | 'opponent' | 'global'

export type EnchantmentDuration = 'combat'

export type EnchantmentTrigger = 'onTargetTurnStart' | 'onTakingDamage'

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

export type EnchantmentAbility =
  | Readonly<{ kind: 'STATIC'; effects: ReadonlyArray<EnchantmentEffect> }>
  | Readonly<{
      kind: 'TRIGGERED'
      trigger: EnchantmentTrigger
      effects: ReadonlyArray<EnchantmentEffect>
    }>

export type EnchantmentTemplate = Readonly<{
  id: EnchantmentId
  name: string
  /** CSS color string used for glow ring render. */
  color: string
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

