import type { EnemyId } from '../core/types/ids'
import type { EnemyIntentExtraEffect } from '../core/types/state'
import type { DiceSpec } from '../core/rng/dice'

/** Scripted sequence (no weights); cycles in order each time intents are rolled. */
export type ScriptedEnemyMove =
  | { kind: 'ATTACK'; intentName: string; damage: DiceSpec; effects?: ReadonlyArray<EnemyIntentExtraEffect> }
  | { kind: 'BUFF'; intentName: string; effects: ReadonlyArray<EnemyIntentExtraEffect> }
  | { kind: 'DEBUFF'; intentName: string; effects: ReadonlyArray<EnemyIntentExtraEffect> }

export type EnemyWeightedMove =
  | { kind: 'ATTACK'; intentName: string; damage: DiceSpec; weight: number; effects?: ReadonlyArray<EnemyIntentExtraEffect> }
  | { kind: 'BUFF'; intentName: string; effects: ReadonlyArray<EnemyIntentExtraEffect>; weight: number }
  | { kind: 'DEBUFF'; intentName: string; effects: ReadonlyArray<EnemyIntentExtraEffect>; weight: number }
  | { kind: 'WAIT'; weight: number }

/** Locked shield roll for Shield Bash; baseline at level 4 is 2d4+1. */
export function shieldBashLockedShieldRoll(level: number): DiceSpec {
  const aboveBaseline = Math.max(0, level - 4)
  return {
    count: 2,
    sides: 4 + Math.floor(aboveBaseline / 6),
    plus: 1 + Math.floor(aboveBaseline / 2),
  }
}

export type EnemyTemplate = Readonly<{
  id: EnemyId
  name: string
  level: number
  boss?: boolean
  /** When true, clearing this enemy ends the run in GAME_WIN (see resolveEvents). */
  gameWinOnVictory?: boolean
  hp: DiceSpec
  /** Added to attack damage when the enemy hits (per point). Defaults to 0. */
  strength?: number
  /**
   * Weighted random intents. Omit when using `intentScript` only.
   */
  intents?: ReadonlyArray<EnemyWeightedMove>
  /** If set, overrides weighted `intents` and cycles through these steps. */
  intentScript?: ReadonlyArray<ScriptedEnemyMove>
}>

export const Enemies: Readonly<Record<EnemyId, EnemyTemplate>> = {
  OKRA_JELLY: {
    id: 'OKRA_JELLY',
    name: 'Okra Jelly',
    level: 0,
    hp: { count: 3, sides: 6, plus: 5 },
    intentScript: [
      { kind: 'BUFF', intentName: 'Charge up', effects: [{ effect: 'strengthgain', value: 1 }] },
      {
        kind: 'ATTACK',
        intentName: 'Slurp',
        damage: { count: 2, sides: 5, plus: 1 },
        effects: [{ effect: 'vampiric' }],
      },
    ],
  },
  CARROT_GOBLIN: {
    id: 'CARROT_GOBLIN',
    name: 'Carrot Goblin',
    level: 0,
    hp: { count: 2, sides: 4 },
    intents: [
      { kind: 'ATTACK', intentName: 'Headbutt', damage: { count: 1, sides: 6 }, weight: 70 },
      { kind: 'ATTACK', intentName: 'Stab', damage: { count: 3, sides: 4 }, weight: 30 },
    ],
  },
  CABBAGE_ORC: {
    id: 'CABBAGE_ORC',
    name: 'Cabbage Orc',
    level: 1,
    hp: { count: 2, sides: 6 },
    intents: [
      {
        kind: 'BUFF',
        intentName: 'Guard',
        effects: [{ effect: 'enemyLockedShieldGain', amount: 10 }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Bash', damage: { count: 1, sides: 12, plus: 2 }, weight: 50 },
    ],
  },
  CELERY_SNAKE: {
    id: 'CELERY_SNAKE',
    name: 'Celery Snake',
    level: 2,
    hp: { count: 2, sides: 6, plus: 2 },
    intents: [
      { kind: 'ATTACK', intentName: 'Bite', damage: { count: 2, sides: 4, plus: 1 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Poison Mist',
        damage: { count: 1, sides: 12, plus: 4 },
        effects: [{ effect: 'shuffleBurdenIntoDeck', cardId: 'SMOKE', count: 1 }],
        weight: 50,
      },
    ],
  },
  RADISH_SPRITE: {
    id: 'RADISH_SPRITE',
    name: 'Radish Sprite',
    level: 3,
    hp: { count: 3, sides: 6, plus: 2 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Poison Fog',
        damage: { count: 3, sides: 3, plus: 2 },
        effects: [{ effect: 'shuffleBurdenIntoDeck', cardId: 'SMOKE', count: 2 }],
        weight: 55,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 2, sides: 7, plus: 1 }, weight: 45 },
    ],
  },
  BEET_ROOTLING: {
    id: 'BEET_ROOTLING',
    name: 'Beet Rootling',
    level: 4,
    hp: { count: 3, sides: 6, plus: 5 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 2, sides: 5, plus: 2 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(4) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 3, sides: 8, plus: 0 }, weight: 50 },
    ],
  },
  CHERRY_IMP: {
    id: 'CHERRY_IMP',
    name: 'Cherry Imp',
    level: 5,
    hp: { count: 4, sides: 6, plus: 3 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 3, sides: 5, plus: 1 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(5) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 2, sides: 10, plus: 4 }, weight: 50 },
    ],
  },
  FIG_PIXIE: {
    id: 'FIG_PIXIE',
    name: 'Fig Pixie',
    level: 6,
    hp: { count: 4, sides: 6, plus: 6 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 4, sides: 4, plus: 0 }, weight: 45 },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 3, sides: 8, plus: 2 }, weight: 55 },
    ],
  },
  KALE_KOBOLD: {
    id: 'KALE_KOBOLD',
    name: 'Kale Kobold',
    level: 7,
    hp: { count: 5, sides: 6, plus: 4 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 2, sides: 7, plus: 4 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(7) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 3, sides: 7, plus: 2 }, weight: 50 },
    ],
  },
  MUSHROOM_GIANT: {
    id: 'MUSHROOM_GIANT',
    name: 'Mushroom Giant',
    level: 8,
    hp: { count: 6, sides: 6, plus: 6 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 2, sides: 8, plus: 1 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(8) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 3, sides: 7, plus: 8 }, weight: 50 },
    ],
  },
  POTATO_TROLL: {
    id: 'POTATO_TROLL',
    name: 'Potato Troll',
    level: 9,
    hp: { count: 7, sides: 6, plus: 8 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 2, sides: 9, plus: 5 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 3, sides: 9, plus: 7 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(9) }],
        weight: 50,
      },
    ],
  },
  BROCCOLI_OGRE: {
    id: 'BROCCOLI_OGRE',
    name: 'Broccoli Ogre',
    level: 10,
    hp: { count: 8, sides: 6, plus: 10 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 3, sides: 9, plus: 4 }, weight: 50 },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 4, sides: 9, plus: 4 }, weight: 50 },
    ],
  },
  ONION_GNOLL: {
    id: 'ONION_GNOLL',
    name: 'Onion Gnoll',
    level: 11,
    hp: { count: 9, sides: 6, plus: 12 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 4, sides: 10, plus: 4 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 4, sides: 9, plus: 3 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(11) }],
        weight: 50,
      },
    ],
  },
  BOKCHOI_BUGBEAR: {
    id: 'BOKCHOI_BUGBEAR',
    name: 'Bokchoi Bugbear',
    level: 12,
    hp: { count: 10, sides: 6, plus: 14 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 5, sides: 9, plus: 10 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 6, sides: 11, plus: 9 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(12) }],
        weight: 50,
      },
    ],
  },
  ZUCCHINI_DRAKE: {
    id: 'ZUCCHINI_DRAKE',
    name: 'Zucchini Drake',
    level: 13,
    hp: { count: 11, sides: 6, plus: 16 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 6, sides: 12, plus: 12 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 6, sides: 11, plus: 11 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(13) }],
        weight: 50,
      },
    ],
  },
  TOMATO_DRAGON: {
    id: 'TOMATO_DRAGON',
    name: 'Tomato Dragon',
    level: 14,
    hp: { count: 12, sides: 6, plus: 18 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 7, sides: 11, plus: 9 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(14) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 7, sides: 11, plus: 11 }, weight: 50 },
    ],
  },
  SAFFRON_CENTAUR: { 
    id: 'SAFFRON_CENTAUR',
    name: 'Saffron Centaur',
    level: 15,
    hp: { count: 13, sides: 6, plus: 20 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 7, sides: 13, plus: 9 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(15) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 7, sides: 13, plus: 11 }, weight: 50 },
    ],
  },
  TOFU_TYRANT: {
    id: 'TOFU_TYRANT',
    name: 'Tofu Tyrant',
    level: 15,
    boss: true,
    hp: { count: 26, sides: 6, plus: 20 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Curdle',
        damage: { count: 8, sides: 13, plus: 9 },
        effects: [{ effect: 'strengthgain', value: 3 }],
        weight: 50,
      },
      {
        kind: 'ATTACK',
        intentName: 'Stinky Tofu',
        damage: { count: 8, sides: 13, plus: 11 },
        effects: [{ effect: 'playerTurnStartBunnyDrain', amount: 5 }],
        weight: 50,
      },
    ],
  },
  PARSNIP_JELLY: {
    id: 'PARSNIP_JELLY',
    name: 'Parsnip Jelly',
    level: 16,
    hp: { count: 13, sides: 12, plus: 25 },
    intentScript: [
      { kind: 'BUFF', intentName: 'Charge up', effects: [{ effect: 'strengthgain', value: 5 }] },
      {
        kind: 'ATTACK',
        intentName: 'Slurp',
        damage: { count: 8, sides: 11, plus: 7 },
        effects: [{ effect: 'vampiric' }],
      },
    ],
  },
  TURNIP_GOBLIN: {
    id: 'TURNIP_GOBLIN',
    name: 'Turnip Goblin',
    level: 16,
    hp: { count: 12, sides: 10, plus: 20 },
    intents: [
      { kind: 'ATTACK', intentName: 'Headbutt', damage: { count: 7, sides: 12, plus: 6 }, weight: 70 },
      { kind: 'ATTACK', intentName: 'Stab', damage: { count: 9, sides: 10, plus: 6 }, weight: 30 },
    ],
  },
  ARTICHOKE_ORC: {
    id: 'ARTICHOKE_ORC',
    name: 'Artichoke Orc',
    level: 17,
    hp: { count: 12, sides: 12, plus: 20 },
    intents: [
      {
        kind: 'BUFF',
        intentName: 'Guard',
        effects: [{ effect: 'enemyLockedShieldGain', amount: 50 }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Bash', damage: { count: 7, sides: 18, plus: 8 }, weight: 50 },
    ],
  },
  RHUBARB_SNAKE: {
    id: 'RHUBARB_SNAKE',
    name: 'Rhubarb Snake',
    level: 18,
    hp: { count: 12, sides: 12, plus: 22 },
    intents: [
      { kind: 'ATTACK', intentName: 'Bite', damage: { count: 8, sides: 10, plus: 7 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Poison Mist',
        damage: { count: 7, sides: 18, plus: 10 },
        effects: [{ effect: 'shuffleBurdenIntoDeck', cardId: 'SMOKE', count: 1 }],
        weight: 50,
      },
    ],
  },
  PERSIMMON_SPRITE: {
    id: 'PERSIMMON_SPRITE',
    name: 'Persimmon Sprite',
    level: 19,
    hp: { count: 13, sides: 12, plus: 22 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Poison Fog',
        damage: { count: 9, sides: 9, plus: 8 },
        effects: [{ effect: 'shuffleBurdenIntoDeck', cardId: 'SMOKE', count: 2 }],
        weight: 55,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 8, sides: 13, plus: 7 }, weight: 45 },
    ],
  },
  POMEGRANATE_ROOTLING: {
    id: 'POMEGRANATE_ROOTLING',
    name: 'Pomegranate Rootling',
    level: 20,
    hp: { count: 13, sides: 12, plus: 25 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 8, sides: 11, plus: 8 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(20) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 9, sides: 14, plus: 6 }, weight: 50 },
    ],
  },
  LYCHEE_IMP: {
    id: 'LYCHEE_IMP',
    name: 'Lychee Imp',
    level: 21,
    hp: { count: 14, sides: 12, plus: 23 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 9, sides: 11, plus: 7 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(21) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 8, sides: 16, plus: 10 }, weight: 50 },
    ],
  },
  GUAVA_PIXIE: {
    id: 'GUAVA_PIXIE',
    name: 'Guava Pixie',
    level: 22,
    hp: { count: 14, sides: 12, plus: 26 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 10, sides: 10, plus: 6 }, weight: 45 },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 9, sides: 14, plus: 8 }, weight: 55 },
    ],
  },
  WATERCRESS_KOBOLD: {
    id: 'WATERCRESS_KOBOLD',
    name: 'Watercress Kobold',
    level: 23,
    hp: { count: 15, sides: 12, plus: 24 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 8, sides: 13, plus: 10 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(23) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 9, sides: 13, plus: 8 }, weight: 50 },
    ],
  },
  EGGPLANT_GIANT: {
    id: 'EGGPLANT_GIANT',
    name: 'Eggplant Giant',
    level: 24,
    hp: { count: 16, sides: 12, plus: 26 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 8, sides: 14, plus: 7 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(24) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 9, sides: 13, plus: 14 }, weight: 50 },
    ],
  },
  RUTABAGA_TROLL: {
    id: 'RUTABAGA_TROLL',
    name: 'Rutabaga Troll',
    level: 25,
    hp: { count: 17, sides: 12, plus: 28 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 8, sides: 15, plus: 11 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 9, sides: 15, plus: 13 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(25) }],
        weight: 50,
      },
    ],
  },
  ASPARAGUS_OGRE: {
    id: 'ASPARAGUS_OGRE',
    name: 'Asparagus Ogre',
    level: 26,
    hp: { count: 18, sides: 12, plus: 30 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 9, sides: 15, plus: 10 }, weight: 50 },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 10, sides: 15, plus: 10 }, weight: 50 },
    ],
  },
  SHALLOT_GNOLL: {
    id: 'SHALLOT_GNOLL',
    name: 'Shallot Gnoll',
    level: 27,
    hp: { count: 19, sides: 12, plus: 32 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 10, sides: 16, plus: 10 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 10, sides: 15, plus: 9 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(27) }],
        weight: 50,
      },
    ],
  },
  FENNEL_BUGBEAR: {
    id: 'FENNEL_BUGBEAR',
    name: 'Fennel Bugbear',
    level: 28,
    hp: { count: 20, sides: 12, plus: 34 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 11, sides: 15, plus: 16 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 12, sides: 17, plus: 15 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(28) }],
        weight: 50,
      },
    ],
  },
  SQUASH_DRAKE: {
    id: 'SQUASH_DRAKE',
    name: 'Squash Drake',
    level: 29,
    hp: { count: 21, sides: 12, plus: 36 },
    intents: [
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 12, sides: 18, plus: 18 }, weight: 50 },
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 12, sides: 17, plus: 17 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(29) }],
        weight: 50,
      },
    ],
  },
  PAPRIKA_DRAGON: {
    id: 'PAPRIKA_DRAGON',
    name: 'Paprika Dragon',
    level: 30,
    hp: { count: 22, sides: 12, plus: 38 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 13, sides: 17, plus: 15 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(30) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 13, sides: 17, plus: 17 }, weight: 50 },
    ],
  },
  NECTARINE_CENTAUR: {
    id: 'NECTARINE_CENTAUR',
    name: 'Nectarine Centaur',
    level: 31,
    hp: { count: 23, sides: 12, plus: 40 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Shield Bash',
        damage: { count: 13, sides: 19, plus: 15 },
        effects: [{ effect: 'enemyLockedShieldGain', roll: shieldBashLockedShieldRoll(31) }],
        weight: 50,
      },
      { kind: 'ATTACK', intentName: 'Tackle', damage: { count: 13, sides: 19, plus: 17 }, weight: 50 },
    ],
  },
  MISO_TYRANT: {
    id: 'MISO_TYRANT',
    name: 'Miso Tyrant',
    level: 32,
    boss: true,
    gameWinOnVictory: true,
    hp: { count: 36, sides: 12, plus: 40 },
    intents: [
      {
        kind: 'ATTACK',
        intentName: 'Curdle',
        damage: { count: 14, sides: 19, plus: 15 },
        effects: [{ effect: 'strengthgain', value: 3 }],
        weight: 50,
      },
      {
        kind: 'ATTACK',
        intentName: 'Stinky Tofu',
        damage: { count: 14, sides: 19, plus: 17 },
        effects: [{ effect: 'playerTurnStartBunnyDrain', amount: 5 }],
        weight: 50,
      },
    ],
  },

}

