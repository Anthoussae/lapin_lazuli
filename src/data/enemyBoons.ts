import type { RngState } from '../core/rng/rng'
import { rngInt } from '../core/rng/rng'
import type { TriggerFxDef } from './triggerFx'

export type EnemyBoonId =
  | 'STRONG'
  | 'MIGHTY'
  | 'TANKY'
  | 'COLOSSAL'
  | 'MEDDLING'
  | 'INKDRINKING'
  | 'ALCHEMIST'
  | 'DRAINING'

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
]

export type BoonTriggerOn = 'player_turn_start'

export type BoonTriggerDef = Readonly<{
  id: string
  on: BoonTriggerOn
  /** Declarative trigger animation; source pulse on the enemy icon is implicit when this is set. */
  triggerFx?: TriggerFxDef
}>

export type EnemyBoon = Readonly<{
  id: EnemyBoonId
  name: string
  /** Weighted frequency used when rolling boons. */
  frequency: number
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
  triggers?: ReadonlyArray<BoonTriggerDef>
}>

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
    tooltipText: 'Has more health.',
  },
  COLOSSAL: {
    id: 'COLOSSAL',
    name: 'Colossal',
    frequency: 3,
    hpMultiplier: 2,
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
    alchemistLeadIngots: 1,
    tooltipText: 'Shuffles Lead ingots into your draw pile at combat start.',
  },
  DRAINING: {
    id: 'DRAINING',
    name: 'Draining',
    frequency: 3,
    playerTurnStartBunnyDrain: 5,
    tooltipText: 'Drains bunnies from your cauldron at the start of each of your turns.',
    triggers: [
      {
        id: 'DRAINING_PLAYER_TURN_START',
        on: 'player_turn_start',
        triggerFx: { targets: [{ kind: 'cauldron', role: 'debuff' }] },
      },
    ],
  },
}

export function enemyBoonStrengthBonus(boons: ReadonlyArray<EnemyBoonId>): number {
  let bonus = 0
  for (const b of boons) bonus += EnemyBoons[b]?.strengthBonus ?? 0
  return bonus
}

/** Product of each boon's hp multiplier (defaults to 1). */
export function enemyBoonHpMultiplierProduct(boons: ReadonlyArray<EnemyBoonId>): number {
  let m = 1
  for (const b of boons) m *= EnemyBoons[b]?.hpMultiplier ?? 1
  return m
}

/** Negative delta applied to {@link PlayerState.baseHandSize} for each combat hand refresh (sum of boon penalties). */
export function combatHandDrawDeltaFromEnemies(
  enemies: ReadonlyArray<Readonly<{ boons: ReadonlyArray<EnemyBoonId> }>>,
): number {
  let delta = 0
  for (const e of enemies) {
    for (const b of e.boons) delta -= EnemyBoons[b]?.handDrawPenalty ?? 0
  }
  return delta
}

/** Negative delta applied to {@link PlayerState.maxEnergy} as combat effective max ink (sum of boon penalties). */
export function combatMaxEnergyDeltaFromEnemies(
  enemies: ReadonlyArray<Readonly<{ boons: ReadonlyArray<EnemyBoonId> }>>,
): number {
  let delta = 0
  for (const e of enemies) {
    for (const b of e.boons) delta -= EnemyBoons[b]?.maxInkPenalty ?? 0
  }
  return delta
}

/** How many Lead ingot instances to inject into the draw pile at combat start (sum across enemies' Alchemist boons). */
export function combatAlchemistLeadIngotCount(
  enemies: ReadonlyArray<Readonly<{ boons: ReadonlyArray<EnemyBoonId> }>>,
): number {
  let n = 0
  for (const e of enemies) {
    for (const b of e.boons) n += EnemyBoons[b]?.alchemistLeadIngots ?? 0
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

/** One random boon weighted by {@link EnemyBoons}[id].frequency. */
export function rollWeightedEnemyBoon(rng: RngState): { rng: RngState; boonId: EnemyBoonId } {
  return rollWeightedEnemyBoonFromPool(rng, EnemyBoonIds)
}

/**
 * Weighted boon roll over {@link EnemyBoonIds} minus `exclude` (same weights as {@link rollWeightedEnemyBoon}).
 * If every id is excluded, falls back to the full pool (should not happen with a single excluded miniboss boon).
 */
export function rollWeightedEnemyBoonExcluding(
  rng: RngState,
  exclude: ReadonlySet<EnemyBoonId> | ReadonlyArray<EnemyBoonId>,
): { rng: RngState; boonId: EnemyBoonId } {
  const ex = new Set(exclude)
  const pool = EnemyBoonIds.filter((id) => !ex.has(id))
  return rollWeightedEnemyBoonFromPool(rng, pool.length ? pool : [...EnemyBoonIds])
}
