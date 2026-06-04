import type { RngState } from '../core/rng/rng'
import { rngInt } from '../core/rng/rng'
import type { EnchantmentId, EnemyId } from '../core/types/ids'
import type { TriggerFxDef } from './triggerFx'
import { Enemies } from './enemies'

export type EnemyBoonId =
  | 'STRONG'
  | 'MIGHTY'
  | 'TANKY'
  | 'COLOSSAL'
  | 'MEDDLING'
  | 'INKDRINKING'
  | 'ALCHEMIST'
  | 'DRAINING'
  | 'BUBBLEBLOWING'
  | 'DISABLING'
  | 'ANTIMAGIC'
  | 'BLESSED'
  | 'GIANT'
  | 'BUNNYRESISTANT'
  | 'FIRERESISTANT'
  | 'POISONRESISTANT'

/** Stable order for weighted rolls (deterministic given RNG). */
export const EnemyBoonIds: ReadonlyArray<EnemyBoonId> = [
  'STRONG',
  'MIGHTY',
  'TANKY',
  'COLOSSAL',
  'MEDDLING',
  'INKDRINKING',
  'ALCHEMIST',
  'DRAINING',
  'BUBBLEBLOWING',
  'DISABLING',
  'ANTIMAGIC',
  'BLESSED',
  'GIANT',
  'BUNNYRESISTANT',
  'FIRERESISTANT',
  'POISONRESISTANT',
]

/** At combat start, enemy gains instances of an enchantment (see {@link enemyCombatStartEnchantmentGrants}). */
export type CombatStartEnchantmentGrant = Readonly<{
  enchantmentId: EnchantmentId
  /** Instances granted per boon (default 1). */
  amount?: number
}>

/** At combat start, disables the player's best deck cards for this combat (see {@link combatStartDisableBestCardCount}). */
export type CombatStartDisableGrant = Readonly<{
  /** Number of best cards to disable per boon (default 1). */
  amount?: number
}>

export type BoonTriggerOn = 'combat_start' | 'player_turn_start'

export type BoonTriggerDef = Readonly<{
  id: string
  on: BoonTriggerOn
  /** Declarative trigger animation; source pulse on the enemy icon is implicit when this is set. */
  triggerFx?: TriggerFxDef
}>

type EnemyBoonBase = Readonly<{
  id: EnemyBoonId
  name: string
  /** Weighted frequency used when rolling boons. */
  frequency: number
  /** Minimum game level before this boon can be rolled onto an enemy (default 0). */
  minimumLevel?: number
  /** Tooltip body text shown on hover. */
  tooltipText: string
  /** Starting strength bonus applied at combat start. */
  strengthBonus?: number
  /** Multiplier applied to rolled max HP after dice (compounds with other boons). */
  hpMultiplier?: number
  /** Each point reduces cards drawn when refreshing the player's hand during this combat. */
  handDrawPenalty?: number
  /** Each point reduces effective max ink (energy) during this combat. */
  maxInkPenalty?: number
  /** Each point shuffles one Lead ingot (`LEAD_INGOT`) into the draw pile at combat start (before opening hand). */
  alchemistLeadIngots?: number
  /** Each point drains this many bunnies at the start of each **player** turn (alive enemies only; can go negative). */
  playerTurnStartBunnyDrain?: number
  /** At combat start, enemy gains {@link CombatStartEnchantmentGrant.amount} instances of the enchantment. */
  combatStartEnchantment?: CombatStartEnchantmentGrant
  /** At combat start, disables the player's best deck cards for this combat. */
  combatStartDisable?: CombatStartDisableGrant
  triggers?: ReadonlyArray<BoonTriggerDef>
}>

/** When {@link scalesWithLevel} is true, numeric boon effects stack once per {@link enemyBoonEffectInstances}. */
export type EnemyBoon = Readonly<
  EnemyBoonBase &
    (
      | { scalesWithLevel?: false | undefined }
      | { scalesWithLevel: true; levelsPerInstance: number }
    )
>

/** How many times a boon's numeric effects apply on an enemy at the given template level. */
export function enemyBoonEffectInstances(boonId: EnemyBoonId, enemyLevel: number): number {
  const boon = EnemyBoons[boonId]
  if (!boon?.scalesWithLevel) return 1
  const per = boon.levelsPerInstance
  if (per <= 0) return 1
  return Math.max(1, Math.floor(enemyLevel / per))
}

export const EnemyBoons: Readonly<Record<EnemyBoonId, EnemyBoon>> = {
  STRONG: {
    id: 'STRONG',
    name: 'Strong',
    frequency: 5,
    strengthBonus: 1,
    tooltipText: 'Deals more damage.',
  },
  MIGHTY: {
    id: 'MIGHTY',
    name: 'Mighty',
    frequency: 3,
    strengthBonus: 2,
    tooltipText: 'Deals much more damage.',
  },
  TANKY: {
    id: 'TANKY',
    name: 'Tanky',
    frequency: 5,
    hpMultiplier: 1.5,
    scalesWithLevel: true,
    levelsPerInstance: 7,
    tooltipText: 'Has more health.',
  },
  COLOSSAL: {
    id: 'COLOSSAL',
    name: 'Colossal',
    frequency: 3,
    hpMultiplier: 2,
    scalesWithLevel: true,
    levelsPerInstance: 12,
    tooltipText: 'Has much more health.',
  },
  MEDDLING: {
    id: 'MEDDLING',
    name: 'Meddling',
    frequency: 3,
    handDrawPenalty: 1,
    tooltipText: 'You draw fewer cards each hand.',
    triggers: [
      {
        id: 'MEDDLING_PLAYER_TURN_START',
        on: 'player_turn_start',
        triggerFx: { targets: [{ kind: 'deck', role: 'debuff' }] },
      },
    ],
  },
  INKDRINKING: {
    id: 'INKDRINKING',
    name: 'Ink-drinking',
    frequency: 1,
    maxInkPenalty: 1,
    tooltipText: 'Reduces your maximum ink.',
    triggers: [
      {
        id: 'INKDRINKING_PLAYER_TURN_START',
        on: 'player_turn_start',
        triggerFx: { targets: [{ kind: 'inkJar', role: 'debuff' }] },
      },
    ],
  },
  ALCHEMIST: {
    id: 'ALCHEMIST',
    name: 'Alchemist',
    frequency: 2,
    scalesWithLevel: true,
    levelsPerInstance: 10,
    alchemistLeadIngots: 1,
    tooltipText: 'Shuffles Lead ingots into your draw pile at combat start.',
    triggers: [
      {
        id: 'ALCHEMIST_COMBAT_START',
        on: 'combat_start',
        triggerFx: { targets: [{ kind: 'deck', role: 'debuff' }] },
      },
    ],
  },
  DRAINING: {
    id: 'DRAINING',
    name: 'Draining',
    frequency: 3,
    playerTurnStartBunnyDrain: 5,
    scalesWithLevel: true,
    levelsPerInstance: 10,
    tooltipText: 'Drains bunnies from your cauldron at the start of each of your turns.',
    triggers: [
      {
        id: 'DRAINING_PLAYER_TURN_START',
        on: 'player_turn_start',
        triggerFx: { targets: [{ kind: 'cauldron', role: 'debuff' }] },
      },
    ],
  },
  BUBBLEBLOWING: {
    id: 'BUBBLEBLOWING',
    name: 'Bubble-blowing',
    frequency: 3,
    scalesWithLevel: true,
    levelsPerInstance: 5,
    combatStartEnchantment: { enchantmentId: 'BUBBLE', amount: 1 },
    tooltipText: 'Enemy starts with $amount bubbles.',
  },
  DISABLING: {
    id: 'DISABLING',
    name: 'Disabling',
    frequency: 3,
    combatStartDisable: { amount: 1 },
    scalesWithLevel: true,
    levelsPerInstance: 10,
    tooltipText: 'Disables your best card.',
    triggers: [
      {
        id: 'DISABLING_COMBAT_START',
        on: 'combat_start',
        triggerFx: {},
      },
    ],
  },
  ANTIMAGIC: {
    id: 'ANTIMAGIC',
    name: 'Anti-magic',
    frequency: 2,
    scalesWithLevel: true,
    levelsPerInstance: 7,
    combatStartEnchantment: { enchantmentId: 'ANTI_MAGIC_SHELL', amount: 1 },
    tooltipText: 'Enemy starts with $amount anti-magic shells.',
  },
  BLESSED: {
    id: 'BLESSED',
    name: 'Blessed',
    frequency: 3,
    scalesWithLevel: true,
    levelsPerInstance: 5,
    combatStartEnchantment: { enchantmentId: 'GUARDIAN_ANGEL', amount: 1 },
    tooltipText: 'Gains shields at the start of turn.',
  },
  GIANT: {
    id: 'GIANT',
    name: 'Giant',
    frequency: 2,
    minimumLevel: 7,
    scalesWithLevel: true,
    levelsPerInstance: 7,
    combatStartEnchantment: { enchantmentId: 'GIANT_GROWTH', amount: 1 },
    tooltipText: 'Enchanted by a sorceress to be very big!',
  },
  BUNNYRESISTANT: {
    id: 'BUNNYRESISTANT',
    name: 'Bunny Resistant',
    frequency: 1,
    minimumLevel: 10,
    combatStartEnchantment: { enchantmentId: 'BUNNY_RESIST', amount: 1 },
    tooltipText: 'Resistant to bunnies.',
  },
  FIRERESISTANT: {
    id: 'FIRERESISTANT',
    name: 'Soggy',
    frequency: 2,
    minimumLevel: 5,
    combatStartEnchantment: { enchantmentId: 'FIRE_RESIST', amount: 1 },
    tooltipText: 'Resistant to fire.',
  },
  POISONRESISTANT: {
    id: 'POISONRESISTANT',
    name: 'Poison Resistant',
    frequency: 2,
    minimumLevel: 5,
    combatStartEnchantment: { enchantmentId: 'POISON_RESIST', amount: 1 },
    tooltipText: 'Resistant to poison.',
  },
}

export function enemyBoonStrengthBonus(boons: ReadonlyArray<EnemyBoonId>, enemyLevel: number): number {
  let bonus = 0
  for (const b of boons) {
    const per = EnemyBoons[b]?.strengthBonus ?? 0
    if (per) bonus += per * enemyBoonEffectInstances(b, enemyLevel)
  }
  return bonus
}

/** Product of each boon's hp multiplier (defaults to 1); scaling boons compound once per effect instance. */
export function enemyBoonHpMultiplierProduct(boons: ReadonlyArray<EnemyBoonId>, enemyLevel: number): number {
  let m = 1
  for (const b of boons) {
    const mult = EnemyBoons[b]?.hpMultiplier ?? 1
    if (mult === 1) continue
    const instances = enemyBoonEffectInstances(b, enemyLevel)
    for (let i = 0; i < instances; i++) m *= mult
  }
  return m
}

type EnemyBoonCarrier = Readonly<{
  boons: ReadonlyArray<EnemyBoonId>
  templateId: EnemyId
}>

function enemyTemplateLevel(templateId: EnemyId): number {
  return Enemies[templateId]?.level ?? 0
}

/** Negative delta applied to {@link PlayerState.baseHandSize} for each combat hand refresh (sum of boon penalties). */
export function combatHandDrawDeltaFromEnemies(enemies: ReadonlyArray<EnemyBoonCarrier>): number {
  let delta = 0
  for (const e of enemies) {
    const level = enemyTemplateLevel(e.templateId)
    for (const b of e.boons) {
      const per = EnemyBoons[b]?.handDrawPenalty ?? 0
      if (per) delta -= per * enemyBoonEffectInstances(b, level)
    }
  }
  return delta
}

/** Negative delta applied to {@link PlayerState.maxEnergy} as combat effective max ink (sum of boon penalties). */
export function combatMaxEnergyDeltaFromEnemies(enemies: ReadonlyArray<EnemyBoonCarrier>): number {
  let delta = 0
  for (const e of enemies) {
    const level = enemyTemplateLevel(e.templateId)
    for (const b of e.boons) {
      const per = EnemyBoons[b]?.maxInkPenalty ?? 0
      if (per) delta -= per * enemyBoonEffectInstances(b, level)
    }
  }
  return delta
}

/** How many Lead ingot instances to inject into the draw pile at combat start (sum across enemies' Alchemist boons). */
export function combatAlchemistLeadIngotCount(enemies: ReadonlyArray<EnemyBoonCarrier>): number {
  let n = 0
  for (const e of enemies) {
    const level = enemyTemplateLevel(e.templateId)
    for (const b of e.boons) {
      const per = EnemyBoons[b]?.alchemistLeadIngots ?? 0
      if (per) n += per * enemyBoonEffectInstances(b, level)
    }
  }
  return n
}

export type EnemyCombatStartEnchantmentGrant = Readonly<{
  enchantmentId: EnchantmentId
  amount: number
}>

/** Enchantment stacks an enemy should receive at combat start from its boons (one entry per boon grant). */
export function enemyCombatStartEnchantmentGrants(
  boons: ReadonlyArray<EnemyBoonId>,
  enemyLevel: number,
): ReadonlyArray<EnemyCombatStartEnchantmentGrant> {
  const grants: EnemyCombatStartEnchantmentGrant[] = []
  for (const b of boons) {
    const grant = EnemyBoons[b]?.combatStartEnchantment
    if (!grant) continue
    const instances = enemyBoonEffectInstances(b, enemyLevel)
    grants.push({
      enchantmentId: grant.enchantmentId,
      amount: Math.max(1, grant.amount ?? 1) * instances,
    })
  }
  return grants
}

/** Resolved hover tooltip for a boon (substitutes `$amount` from {@link CombatStartEnchantmentGrant}). */
export function enemyBoonTooltipText(boonId: EnemyBoonId, enemyLevel: number): string {
  const boon = EnemyBoons[boonId]
  const raw = boon.tooltipText
  const grant = boon.combatStartEnchantment
  if (!grant || !raw.includes('$amount')) return raw
  const instances = enemyBoonEffectInstances(boonId, enemyLevel)
  const amount = Math.max(1, grant.amount ?? 1) * instances
  return raw.split('$amount').join(String(amount))
}

/** How many of the player's best deck cards to disable at combat start (sum across enemies' Disabling boons). */
export function combatStartDisableBestCardCount(enemies: ReadonlyArray<EnemyBoonCarrier>): number {
  let n = 0
  for (const e of enemies) {
    const level = enemyTemplateLevel(e.templateId)
    for (const b of e.boons) {
      const grant = EnemyBoons[b]?.combatStartDisable
      if (grant) n += Math.max(1, grant.amount ?? 1) * enemyBoonEffectInstances(b, level)
    }
  }
  return n
}

function rollWeightedEnemyBoonFromPool(
  rng: RngState,
  pool: ReadonlyArray<EnemyBoonId>,
): { rng: RngState; boonId: EnemyBoonId } {
  const total = pool.reduce((acc, id) => acc + Math.max(0, EnemyBoons[id]?.frequency ?? 0), 0)
  const span = Math.max(1, total)
  const [r2, n] = rngInt(rng, 0, span)
  let cursor = 0
  let picked: EnemyBoonId = pool[0]!
  for (const id of pool) {
    cursor += Math.max(0, EnemyBoons[id]?.frequency ?? 0)
    if (n < cursor) {
      picked = id
      break
    }
  }
  return { rng: r2, boonId: picked }
}

/** Boon ids eligible for random rolls at the given game level. */
export function enemyBoonsEligibleAtLevel(level: number): ReadonlyArray<EnemyBoonId> {
  return EnemyBoonIds.filter((id) => (EnemyBoons[id]?.minimumLevel ?? 0) <= level)
}

/** One random boon weighted by {@link EnemyBoons}[id].frequency. */
export function rollWeightedEnemyBoon(
  rng: RngState,
  level: number,
): { rng: RngState; boonId: EnemyBoonId } {
  const pool = enemyBoonsEligibleAtLevel(level)
  return rollWeightedEnemyBoonFromPool(rng, pool.length ? pool : [...EnemyBoonIds])
}

/**
 * Weighted boon roll over level-eligible ids minus `exclude` (same weights as {@link rollWeightedEnemyBoon}).
 * If every id is excluded, falls back to the level-eligible pool (should not happen with a single excluded miniboss boon).
 */
export function rollWeightedEnemyBoonExcluding(
  rng: RngState,
  level: number,
  exclude: ReadonlySet<EnemyBoonId> | ReadonlyArray<EnemyBoonId>,
): { rng: RngState; boonId: EnemyBoonId } {
  const ex = new Set(exclude)
  const eligible = enemyBoonsEligibleAtLevel(level)
  const pool = eligible.filter((id) => !ex.has(id))
  const fallback = eligible.length ? eligible : [...EnemyBoonIds]
  return rollWeightedEnemyBoonFromPool(rng, pool.length ? pool : fallback)
}
