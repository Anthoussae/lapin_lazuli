import type { DiceSpec } from '../core/rng/dice'
import type { EnemyIntentId } from '../core/types/ids'
import type { EnemyIntentExtraEffect } from '../core/types/state'
import type { EnemyIntentKind } from './enemyIntentKinds'

/** Combat resolution discriminant (ATTACK / BUFF / DEBUFF). */
export type EnemyIntentResolveKind = 'ATTACK' | 'BUFF' | 'DEBUFF'

/** Rolled move row produced from a catalog intent at a given enemy level. */
export type ResolvedEnemyIntentMove =
  | {
      kind: 'ATTACK'
      intentKind: EnemyIntentKind
      intentName: string
      damage: DiceSpec
      effects?: ReadonlyArray<EnemyIntentExtraEffect>
    }
  | { kind: 'BUFF'; intentKind: EnemyIntentKind; intentName: string; effects: ReadonlyArray<EnemyIntentExtraEffect> }
  | { kind: 'DEBUFF'; intentKind: EnemyIntentKind; intentName: string; effects: ReadonlyArray<EnemyIntentExtraEffect> }

export const EnemyIntentIds: ReadonlyArray<EnemyIntentId> = [
  'SMALL_ATTACK',
  'SMALL_SHIELD_BASH',
  'SMALL_DEFEND',
  'SMALL_VAMPIRIC_ATTACK',
  'SMALL_FURY_SWIPES',
  'SMALL_SMOKE_ATTACK',
  'SMALL_DIZZYING_BLOW',
  'WEAKENING_BLOW',
  'RUSTING_BLOW',
  'AMPLIFYING_BLOW',
  'SMALL_POISON_CURSE',
  'BLOW_SMOKE',
  'SMALL_CHARGE_UP',
  'MEDIUM_CHARGE_UP',
  'LARGE_CHARGE_UP',
  'SMALL_PREPARE',
  'MEDIUM_PREPARE',
  'MEDIUM_ATTACK',
  'MEDIUM_DEFEND',
  'LARGE_ATTACK',
  'LARGE_DEFEND',
  'AMPLIFY_DAMAGE',
  'WEAKEN',
  'RUST',
  'OMNICURSE',
]

/** Attack damage before rolling; maps to NdS+bonus (e.g. 2d6+4). */
export type EnemyIntentDamage = Readonly<{
  dice: number
  sides: number
  bonusDamage: number
}>

/** When {@link scalesWithLevel} is true, numeric effects and attack dice repeat per {@link enemyIntentEffectInstances}. */
export type EnemyIntentScaling = Readonly<
  { scalesWithLevel?: false | undefined } | { scalesWithLevel: true; levelsPerInstance: number }
>

type EnemyIntentDefBase = Readonly<{
  id: EnemyIntentId
  /** UI / rules tag (attackOnly, guardOnly, …). */
  intentKind: EnemyIntentKind
  /** Display name shown on the intent icon. */
  name: string
}> &
  EnemyIntentScaling

export type EnemyIntentAttackDef = EnemyIntentDefBase &
  Readonly<{
    damage: EnemyIntentDamage
    effects?: ReadonlyArray<EnemyIntentExtraEffect>
  }>

export type EnemyIntentBuffDef = EnemyIntentDefBase &
  Readonly<{
    effects: ReadonlyArray<EnemyIntentExtraEffect>
  }>

export type EnemyIntentDebuffDef = EnemyIntentDefBase &
  Readonly<{
    effects: ReadonlyArray<EnemyIntentExtraEffect>
  }>

export type EnemyIntentDef = EnemyIntentAttackDef | EnemyIntentBuffDef | EnemyIntentDebuffDef

export function isEnemyIntentAttackDef(def: EnemyIntentDef): def is EnemyIntentAttackDef {
  return 'damage' in def
}

/** How many times this intent's numeric values apply at the given enemy template level. */
export function enemyIntentEffectInstances(def: EnemyIntentDef, enemyLevel: number): number {
  if (!def.scalesWithLevel) return 1
  const per = def.levelsPerInstance
  if (per <= 0) return 1
  return Math.max(1, Math.floor(enemyLevel / per))
}

export function enemyIntentEffectInstancesById(intentId: EnemyIntentId, enemyLevel: number): number {
  return enemyIntentEffectInstances(EnemyIntents[intentId], enemyLevel)
}

/** Scale attack dice to a single roll spec (e.g. three instances of 1d6+1 → 3d6+3). */
export function enemyIntentDamageToDiceSpec(damage: EnemyIntentDamage, instances: number): DiceSpec {
  const n = Math.max(1, instances)
  return {
    count: Math.max(0, damage.dice | 0) * n,
    sides: Math.max(1, damage.sides | 0),
    plus: (damage.bonusDamage | 0) * n,
  }
}

function scaleIntentEffect(fx: EnemyIntentExtraEffect, instances: number): EnemyIntentExtraEffect {
  const n = Math.max(1, instances)
  switch (fx.effect) {
    case 'strengthgain': {
      const amount = fx.nonScaling ? fx.amount : fx.amount * n
      return { effect: 'strengthgain', amount }
    }
    case 'playerTurnStartBunnyDrain':
      return { effect: 'playerTurnStartBunnyDrain', amount: fx.amount * n }
    case 'enemyLockedShieldGain':
      if ('amount' in fx) return { effect: 'enemyLockedShieldGain', amount: fx.amount * n }
      return {
        effect: 'enemyLockedShieldGain',
        roll: {
          count: fx.roll.count * n,
          sides: fx.roll.sides,
          plus: (fx.roll.plus ?? 0) * n,
        },
      }
    case 'enemyShieldGain':
      return { effect: 'enemyShieldGain', amount: fx.amount * n }
    case 'shuffleBurdenIntoDeck': {
      const count = fx.nonScaling ? fx.count : fx.count * n
      return { effect: 'shuffleBurdenIntoDeck', cardId: fx.cardId, count }
    }
    case 'applyEnchantment': {
      const stacks = fx.nonScaling ? (fx.stacks ?? 1) : (fx.stacks ?? 1) * n
      return {
        effect: 'applyEnchantment',
        enchantmentId: fx.enchantmentId,
        stacks,
        setEnchantmentEffectsAmounts: fx.setEnchantmentEffectsAmounts,
      }
    }
    case 'vampiric':
      return fx
  }
}

function scaleIntentEffects(
  effects: ReadonlyArray<EnemyIntentExtraEffect> | undefined,
  instances: number,
): ReadonlyArray<EnemyIntentExtraEffect> | undefined {
  if (!effects?.length) return effects
  return effects.map((fx) => scaleIntentEffect(fx, instances))
}

/** Combat resolution discriminant derived from intent data. */
export function enemyIntentResolveKind(def: EnemyIntentDef): EnemyIntentResolveKind {
  if (isEnemyIntentAttackDef(def)) return 'ATTACK'
  if (def.intentKind === 'debuffOnly' || def.intentKind === 'debuffAttack') return 'DEBUFF'
  return 'BUFF'
}

/** Build a scripted/weighted move row for an enemy at a given template level. */
export function resolveEnemyIntentDefForLevel(def: EnemyIntentDef, enemyLevel: number): ResolvedEnemyIntentMove {
  const instances = enemyIntentEffectInstances(def, enemyLevel)
  const resolveKind = enemyIntentResolveKind(def)

  if (resolveKind === 'ATTACK' && isEnemyIntentAttackDef(def)) {
    return {
      kind: 'ATTACK',
      intentKind: def.intentKind,
      intentName: def.name,
      damage: enemyIntentDamageToDiceSpec(def.damage, instances),
      effects: scaleIntentEffects(def.effects, instances),
    }
  }

  const effects = scaleIntentEffects(def.effects, instances) ?? []
  if (resolveKind === 'DEBUFF') {
    return { kind: 'DEBUFF', intentKind: def.intentKind, intentName: def.name, effects }
  }
  return { kind: 'BUFF', intentKind: def.intentKind, intentName: def.name, effects }
}

export const EnemyIntents: Readonly<Record<EnemyIntentId, EnemyIntentDef>> = {
  SMALL_ATTACK: {
    id: 'SMALL_ATTACK',
    intentKind: 'attackOnly',
    name: 'Bash',
    scalesWithLevel: true,
    
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 2 },
  },
  SMALL_SHIELD_BASH: {
    id: 'SMALL_SHIELD_BASH',
    intentKind: 'guardAttack',
    name: 'Shield Bash',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 1 },
    effects: [{ effect: 'enemyShieldGain', amount: 2 }],
  },
  SMALL_DEFEND: {
    id: 'SMALL_DEFEND',
    intentKind: 'guardOnly',
    name: 'Guard',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    effects: [{ effect: 'enemyLockedShieldGain', amount: 3 }],
  },
  SMALL_VAMPIRIC_ATTACK: {
    id: 'SMALL_VAMPIRIC_ATTACK',
    intentKind: 'buffAttack',
    name: 'Drain',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 3, bonusDamage: 2 },
    effects: [{ effect: 'vampiric' }],
  },
  SMALL_FURY_SWIPES: {
    id: 'SMALL_FURY_SWIPES',
    intentKind: 'buffAttack',
    name: 'Fury Swipes',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 2 },
    effects: [{ effect: 'strengthgain', amount: 3, nonScaling: true }],
  },
  SMALL_SMOKE_ATTACK: {
    id: 'SMALL_SMOKE_ATTACK',
    intentKind: 'debuffAttack',
    name: 'Billow',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 3, bonusDamage: 1 },
    effects: [{ effect: 'shuffleBurdenIntoDeck', cardId: 'SMOKE', count: 1, nonScaling: true }],
  },
  SMALL_DIZZYING_BLOW: {
    id: 'SMALL_DIZZYING_BLOW',
    intentKind: 'debuffAttack',
    name: 'Dizzying blow',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 3, bonusDamage: 1 },
    effects: [{ effect: 'applyEnchantment', enchantmentId: 'DIZZY', nonScaling: true }],
  },
  WEAKENING_BLOW: {
    id: 'WEAKENING_BLOW',
    intentKind: 'debuffAttack',
    name: 'Weakening blow',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 2 },
    effects: [{ effect: 'applyEnchantment', enchantmentId: 'WEAKEN', nonScaling: true }],
  },
  RUSTING_BLOW: {
    id: 'RUSTING_BLOW',
    intentKind: 'debuffAttack',
    name: 'Rusting blow',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 2 },
    effects: [{ effect: 'applyEnchantment', enchantmentId: 'RUST', nonScaling: true }],
  },
  AMPLIFYING_BLOW: {
    id: 'AMPLIFYING_BLOW',
    intentKind: 'debuffAttack',
    name: 'Amplifying blow',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 2 },
    effects: [{ effect: 'applyEnchantment', enchantmentId: 'AMPLIFY_DAMAGE', nonScaling: true }],
  },
  SMALL_POISON_CURSE: {
    id: 'SMALL_POISON_CURSE',
    intentKind: 'debuffOnly',
    name: 'Poison',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    effects: [
      {
        effect: 'applyEnchantment',
        enchantmentId: 'POISON',
        setEnchantmentEffectsAmounts: 1,
      },
    ],
  },
  BLOW_SMOKE: {
    id: 'BLOW_SMOKE',
    intentKind: 'debuffOnly',
    name: 'Fog',
    effects: [{ effect: 'shuffleBurdenIntoDeck', cardId: 'SMOKE', count: 3 }],
  },
  SMALL_CHARGE_UP: {
    id: 'SMALL_CHARGE_UP',
    intentKind: 'buffOnly',
    name: 'Charge up',
    effects: [{ effect: 'strengthgain', amount: 5 }],
  },
  MEDIUM_CHARGE_UP: {
    id: 'MEDIUM_CHARGE_UP',
    intentKind: 'buffOnly',
    name: 'Charge up',
    effects: [{ effect: 'strengthgain', amount: 10 }],
  },
  LARGE_CHARGE_UP: {
    id: 'LARGE_CHARGE_UP',
    intentKind: 'buffOnly',
    name: 'Charge up',
    effects: [{ effect: 'strengthgain', amount: 15 }],
  },
  SMALL_PREPARE: {
    id: 'SMALL_PREPARE',
    intentKind: 'special',
    name: 'Prepare',
    scalesWithLevel: true,
    levelsPerInstance: 3,
    effects: [
      { effect: 'enemyLockedShieldGain', amount: 3 },
      { effect: 'strengthgain', amount: 5, nonScaling: true },
    ],
  },
  MEDIUM_PREPARE: {
    id: 'MEDIUM_PREPARE',
    intentKind: 'special',
    name: 'Prepare',
    scalesWithLevel: true,
    levelsPerInstance: 3,
    effects: [
      { effect: 'enemyLockedShieldGain', amount: 4 },
      { effect: 'strengthgain', amount: 10, nonScaling: true },
    ],
  },
  MEDIUM_ATTACK: {
    id: 'MEDIUM_ATTACK',
    intentKind: 'attackOnly',
    name: 'Bash',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 2 },
  },
  MEDIUM_DEFEND: {
    id: 'MEDIUM_DEFEND',
    intentKind: 'guardOnly',
    name: 'Guard',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    effects: [{ effect: 'enemyLockedShieldGain', amount: 4 }],
  },
  LARGE_ATTACK: {
    id: 'LARGE_ATTACK',
    intentKind: 'attackOnly',
    name: 'Bash',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    damage: { dice: 1, sides: 4, bonusDamage: 3 },
  },
  LARGE_DEFEND: {
    id: 'LARGE_DEFEND',
    intentKind: 'guardOnly',
    name: 'Guard',
    scalesWithLevel: true,
    levelsPerInstance: 2,
    effects: [{ effect: 'enemyLockedShieldGain', amount: 5 }],
  },
  AMPLIFY_DAMAGE: {
    id: 'AMPLIFY_DAMAGE',
    intentKind: 'debuffOnly',
    name: 'Amplify Damage',
    effects: [{ effect: 'applyEnchantment', enchantmentId: 'AMPLIFY_DAMAGE' }],
  },
  WEAKEN: {
    id: 'WEAKEN',
    intentKind: 'debuffOnly',
    name: 'Weaken',
    effects: [{ effect: 'applyEnchantment', enchantmentId: 'WEAKEN' }],
  },
  RUST: {
    id: 'RUST',
    intentKind: 'debuffOnly',
    name: 'Rust',
    effects: [{ effect: 'applyEnchantment', enchantmentId: 'RUST' }],
  },
  OMNICURSE: {
    id: 'OMNICURSE',
    intentKind: 'debuffOnly',
    name: 'Curse',
    effects: [
      { effect: 'applyEnchantment', enchantmentId: 'WEAKEN' },
      { effect: 'applyEnchantment', enchantmentId: 'RUST' },
      { effect: 'applyEnchantment', enchantmentId: 'AMPLIFY_DAMAGE' },
    ],
  },
}
