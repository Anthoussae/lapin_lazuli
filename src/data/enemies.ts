import type { EnemyId, EnchantmentId, EnemyIntentId } from '../core/types/ids'
import type { DiceSpec } from '../core/rng/dice'
import type { EnemyBoonId } from './enemyBoons'

/** Per-enemy row in the intent pool; references a catalog intent from enemyIntents.ts. */
export type EnemyIntentEntry = Readonly<{
  intentId: EnemyIntentId
  /** Relative pick weight when rolling the next intent. Default 1. */
  choiceWeight?: number
  /** When true, can be picked twice in a row. Default false. */
  repeatable?: boolean
  /** When true, once chosen this intent is never picked again this combat. */
  neverRepeat?: boolean
  /** Overrides the catalog intent name for in-game display only. */
  renameDisplayIntent?: string
  /** When true, this intent is chosen on the enemy's first roll (before weighted selection). */
  alwaysFirst?: boolean
}>

export type EnemyTemplate = Readonly<{
  id: EnemyId
  name: string
  level: number
  boss?: boolean
  /** When true, clearing this enemy ends the run in GAME_WIN (see resolveEvents). */
  gameWinOnVictory?: boolean
  /** Testing helper: when set, enemy always spawns with these enchantment(s). */
  forceEnchantment?: EnchantmentId | ReadonlyArray<EnchantmentId>
  /** Testing helper: when set, enemy always spawns with this boon. */
  forceBoon?: EnemyBoonId
  /**
   * Chance (0–1) to dodge fire spell damage and cauldron bunny releases (effective max 50%).
   * Does not dodge other player damage sources.
   */
  dodgeChance?: number
  hp: DiceSpec
  /**
   * Starting strength stacks. Each point adds +1 flat damage to attack intents after
   * level scaling and dice rolls (not scaled by enemy level or intent instances).
   */
  strength?: number
  /** Weighted intent pool. */
  intents: ReadonlyArray<EnemyIntentEntry>
  /** PNG filename under assets/images/monsters/; omit to use the default placeholder. */
  sprite?: string
  /** When set, dark line art in `sprite` is tinted to this hex color (`#rrggbb`) in combat. */
  color?: string
}>

export const Enemies: Readonly<Record<EnemyId, EnemyTemplate>> = {
  
  
  
  //bosses 15, 30, 45
  TOFU_TYRANT: {
    id: 'TOFU_TYRANT',
    name: 'Tofu Tyrant',
    sprite: 'tofuTyrant.png',
    level: 15,
    boss: true,
    forceEnchantment: 'BUBBLE',
    hp: { count: 20, sides: 6, plus: 50 },
    intents: [
      {intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tofu Punch' },
      {intentId: 'SMALL_DIZZYING_BLOW', renameDisplayIntent: 'Tofu Spin', choiceWeight: 1, neverRepeat: true },
      {intentId: 'SMALL_PREPARE', renameDisplayIntent: 'Tofu Charge', choiceWeight: 1 },
      {intentId: 'SMALL_SMOKE_ATTACK', renameDisplayIntent: 'Tofu Steam', choiceWeight: 1 },
    ],
  },
  MISO_MONSTROSITY: {
    id: 'MISO_MONSTROSITY',
    name: 'Tofu Tyrant',
    sprite: 'tofuTyrant.png',
    level: 30,
    boss: true,
    forceEnchantment: 'BUBBLE',
    hp: { count: 40, sides: 6, plus: 100 },
    intents: [
      {intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tofu Punch' },
      {intentId: 'SMALL_DIZZYING_BLOW', renameDisplayIntent: 'Tofu Spin', choiceWeight: 1, neverRepeat: true },
      {intentId: 'SMALL_PREPARE', renameDisplayIntent: 'Tofu Charge', choiceWeight: 1 },
      {intentId: 'SMALL_SMOKE_ATTACK', renameDisplayIntent: 'Tofu Steam', choiceWeight: 1 },
    ],
  },
  SOYBEAN_EMPEROR: {
    id: 'SOYBEAN_EMPEROR',
    name: 'Soybean Emperor',
    sprite: 'tofuTyrant.png',
    level: 45,
    boss: true,
    gameWinOnVictory: true,
    forceEnchantment: 'BUBBLE',
    hp: { count: 60, sides: 6, plus: 150 },
    intents: [
      {intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tofu Punch' },
      {intentId: 'SMALL_DIZZYING_BLOW', renameDisplayIntent: 'Tofu Spin', choiceWeight: 1, neverRepeat: true },
      {intentId: 'SMALL_PREPARE', renameDisplayIntent: 'Tofu Charge', choiceWeight: 1 },
      {intentId: 'SMALL_SMOKE_ATTACK', renameDisplayIntent: 'Tofu Steam', choiceWeight: 1 },
    ],
  },
  // carrot orc set: 1, 4, 7, 10, 13, 16, 19
  CARROT_ORC_0: {
    id: 'CARROT_ORC_0',
    name: 'Carrot Orc',
    level: 1,
    sprite: 'carrotmonster.png',
    color: '#000000',
    hp: { count: 2, sides: 6, plus: 10 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Gnaw' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' }
    ],
  },
  
  CARROT_ORC_1: {
    id: 'CARROT_ORC_1',
    name: 'Carrot Orc',
    level: 4,
    sprite: 'carrotmonster.png',
    color: '#2b1400',
    hp: { count: 5, sides: 6, plus: 11 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Gnaw' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' }
    ],
  },
  
  CARROT_ORC_2: {
    id: 'CARROT_ORC_2',
    name: 'Carrot Orc',
    level: 7,
    sprite: 'carrotmonster.png',
    color: '#552900',
    hp: { count: 8, sides: 6, plus: 12 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Gnaw' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' }
    ],
  },
  
  CARROT_ORC_3: {
    id: 'CARROT_ORC_3',
    name: 'Carrot Orc',
    level: 10,
    sprite: 'carrotmonster.png',
    color: '#803d00',
    hp: { count: 11, sides: 6, plus: 13 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Gnaw' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' }
    ],
  },
  
  CARROT_ORC_4: {
    id: 'CARROT_ORC_4',
    name: 'Carrot Orc',
    level: 13,
    sprite: 'carrotmonster.png',
    color: '#aa5100',
    hp: { count: 14, sides: 6, plus: 14 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Gnaw' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' }
    ],
  },
  
  CARROT_ORC_5: {
    id: 'CARROT_ORC_5',
    name: 'Carrot Orc',
    level: 16,
    sprite: 'carrotmonster.png',
    color: '#d56600',
    hp: { count: 17, sides: 6, plus: 15 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Gnaw' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' }
    ],
  },
  
  CARROT_ORC_6: {
    id: 'CARROT_ORC_6',
    name: 'Carrot Orc',
    level: 19,
    sprite: 'carrotmonster.png',
    color: '#ff7a00',
    hp: { count: 20, sides: 6, plus: 16 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Gnaw' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' }
    ],
  },

  // onion goblin set: 0, 3, 6, 9, 12, 16, 18
  ONION_GOBLIN_0: {
    id: 'ONION_GOBLIN_0',
    name: 'Onion Goblin',
    color: '#000000',
    sprite: 'onionmonster.png',
    level: 0,
    hp: { count: 2, sides: 6, plus: 4 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 2, renameDisplayIntent: 'Chop' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
    ],
  },
  
  ONION_GOBLIN_1: {
    id: 'ONION_GOBLIN_1',
    name: 'Onion Goblin',
    color: '#2b1400',
    sprite: 'onionmonster.png',
    level: 3,
    hp: { count: 5, sides: 6, plus: 5 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 2, renameDisplayIntent: 'Chop' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
    ],
  },
  
  ONION_GOBLIN_2: {
    id: 'ONION_GOBLIN_2',
    name: 'Onion Goblin',
    color: '#552900',
    sprite: 'onionmonster.png',
    level: 6,
    hp: { count: 8, sides: 6, plus: 6 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 2, renameDisplayIntent: 'Chop' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
    ],
  },
  
  ONION_GOBLIN_3: {
    id: 'ONION_GOBLIN_3',
    name: 'Onion Goblin',
    color: '#803d00',
    sprite: 'onionmonster.png',
    level: 9,
    hp: { count: 11, sides: 6, plus: 7 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 2, renameDisplayIntent: 'Chop' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
    ],
  },
  
  ONION_GOBLIN_4: {
    id: 'ONION_GOBLIN_4',
    name: 'Onion Goblin',
    color: '#aa5100',
    sprite: 'onionmonster.png',
    level: 12,
    hp: { count: 14, sides: 6, plus: 8 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 2, renameDisplayIntent: 'Chop' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
    ],
  },
  
  ONION_GOBLIN_5: {
    id: 'ONION_GOBLIN_5',
    name: 'Onion Goblin',
    color: '#d56600',
    sprite: 'onionmonster.png',
    level: 16,
    hp: { count: 18, sides: 6, plus: 9 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 2, renameDisplayIntent: 'Chop' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
    ],
  },
  
  ONION_GOBLIN_6: {
    id: 'ONION_GOBLIN_6',
    name: 'Onion Goblin',
    color: '#ff7a00',
    sprite: 'onionmonster.png',
    level: 18,
    hp: { count: 20, sides: 6, plus: 10 },
    intents: [
      { intentId: 'SMALL_ATTACK', choiceWeight: 2, renameDisplayIntent: 'Chop' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
    ],
  },

  // zerry cube set: 0, 5, 10, 15, 20, 25, 30
  ZERRY_CUBE_0: {
    id: 'ZERRY_CUBE_0',
    name: 'Zerry Cube',
    level: 0,
    strength: 0,
    sprite: 'gelatinousCube.png',
    color: '#000000',
    hp: { count: 3, sides: 6, plus: 12 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', renameDisplayIntent: 'Slurp', choiceWeight: 1 },
      { intentId: 'WEAKENING_BLOW', renameDisplayIntent: 'Lick', choiceWeight: 1 },
      { intentId: 'RUSTING_BLOW', renameDisplayIntent: 'Rusting Drool', choiceWeight: 1 },
      { intentId: 'SMALL_CHARGE_UP', renameDisplayIntent: 'Charge up', choiceWeight: 1, alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  ZERRY_CUBE_1: {
    id: 'ZERRY_CUBE_1',
    name: 'Zerry Cube',
    level: 5,
    strength: 2,
    sprite: 'gelatinousCube.png',
    color: '#002b00',
    hp: { count: 8, sides: 6, plus: 22 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', renameDisplayIntent: 'Slurp', choiceWeight: 1 },
      { intentId: 'WEAKENING_BLOW', renameDisplayIntent: 'Lick', choiceWeight: 1 },
      { intentId: 'RUSTING_BLOW', renameDisplayIntent: 'Rusting Drool', choiceWeight: 1 },
      { intentId: 'SMALL_CHARGE_UP', renameDisplayIntent: 'Charge up', choiceWeight: 1, alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  ZERRY_CUBE_2: {
    id: 'ZERRY_CUBE_2',
    name: 'Zerry Cube',
    level: 10,
    strength: 4,
    sprite: 'gelatinousCube.png',
    color: '#005500',
    hp: { count: 13, sides: 6, plus: 32 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', renameDisplayIntent: 'Slurp', choiceWeight: 1 },
      { intentId: 'WEAKENING_BLOW', renameDisplayIntent: 'Lick', choiceWeight: 1 },
      { intentId: 'RUSTING_BLOW', renameDisplayIntent: 'Rusting Drool', choiceWeight: 1 },
      { intentId: 'SMALL_CHARGE_UP', renameDisplayIntent: 'Charge up', choiceWeight: 1, alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  ZERRY_CUBE_3: {
    id: 'ZERRY_CUBE_3',
    name: 'Zerry Cube',
    level: 14,
    strength: 6,
    sprite: 'gelatinousCube.png',
    color: '#008000',
    hp: { count: 17, sides: 6, plus: 42 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', renameDisplayIntent: 'Slurp', choiceWeight: 1 },
      { intentId: 'WEAKENING_BLOW', renameDisplayIntent: 'Lick', choiceWeight: 1 },
      { intentId: 'RUSTING_BLOW', renameDisplayIntent: 'Rusting Drool', choiceWeight: 1 },
      { intentId: 'SMALL_CHARGE_UP', renameDisplayIntent: 'Charge up', choiceWeight: 1, alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  ZERRY_CUBE_4: {
    id: 'ZERRY_CUBE_4',
    name: 'Zerry Cube',
    level: 20,
    strength: 8,
    sprite: 'gelatinousCube.png',
    color: '#00aa00',
    hp: { count: 23, sides: 6, plus: 52 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', renameDisplayIntent: 'Slurp', choiceWeight: 1 },
      { intentId: 'WEAKENING_BLOW', renameDisplayIntent: 'Lick', choiceWeight: 1 },
      { intentId: 'RUSTING_BLOW', renameDisplayIntent: 'Rusting Drool', choiceWeight: 1 },
      { intentId: 'SMALL_CHARGE_UP', renameDisplayIntent: 'Charge up', choiceWeight: 1, alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  ZERRY_CUBE_5: {
    id: 'ZERRY_CUBE_5',
    name: 'Zerry Cube',
    level: 25,
    strength: 10,
    sprite: 'gelatinousCube.png',
    color: '#00d500',
    hp: { count: 28, sides: 6, plus: 62 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', renameDisplayIntent: 'Slurp', choiceWeight: 1 },
      { intentId: 'WEAKENING_BLOW', renameDisplayIntent: 'Lick', choiceWeight: 1 },
      { intentId: 'RUSTING_BLOW', renameDisplayIntent: 'Rusting Drool', choiceWeight: 1 },
      { intentId: 'SMALL_CHARGE_UP', renameDisplayIntent: 'Charge up', choiceWeight: 1, alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  ZERRY_CUBE_6: {
    id: 'ZERRY_CUBE_6',
    name: 'Zerry Cube',
    level: 31,
    strength: 12,
    sprite: 'gelatinousCube.png',
    color: '#00ff00',
    hp: { count: 35, sides: 6, plus: 72 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', renameDisplayIntent: 'Slurp', choiceWeight: 1 },
      { intentId: 'WEAKENING_BLOW', renameDisplayIntent: 'Lick', choiceWeight: 1 },
      { intentId: 'RUSTING_BLOW', renameDisplayIntent: 'Rusting Drool', choiceWeight: 1 },
      { intentId: 'SMALL_CHARGE_UP', renameDisplayIntent: 'Charge up', choiceWeight: 1, alwaysFirst: true, neverRepeat: true },
    ],
  },

  // dark mage set: 1, 6, 11, 16, 21, 26, 31
  DARK_MAGE_0: {
    id: 'DARK_MAGE_0',
    name: 'Dark Mage',
    level: 2,
    hp: { count: 3, sides: 6, plus: 8 },
    intents: [
      { intentId: 'OMNICURSE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Curse' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Darkblast' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Dark Ritual' },
    ],
    sprite: 'wizard.png',
    color: '#000000',
  },
  
  DARK_MAGE_1: {
    id: 'DARK_MAGE_1',
    name: 'Dark Mage',
    level: 7,
    hp: { count: 8, sides: 6, plus: 9 },
    intents: [
      { intentId: 'OMNICURSE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Curse' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Darkblast' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Dark Ritual' },
    ],
    sprite: 'wizard.png',
    color: '#2b002b',
  },
  
  DARK_MAGE_2: {
    id: 'DARK_MAGE_2',
    name: 'Dark Mage',
    level: 12,
    hp: { count: 13, sides: 6, plus: 10 },
    intents: [
      { intentId: 'OMNICURSE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Curse' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Darkblast' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Dark Ritual' },
    ],
    sprite: 'wizard.png',
    color: '#550055',
  },
  
  DARK_MAGE_3: {
    id: 'DARK_MAGE_3',
    name: 'Dark Mage',
    level: 17,
    hp: { count: 18, sides: 6, plus: 11 },
    intents: [
      { intentId: 'OMNICURSE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Curse' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Darkblast' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Dark Ritual' },
    ],
    sprite: 'wizard.png',
    color: '#800080',
  },
  
  DARK_MAGE_4: {
    id: 'DARK_MAGE_4',
    name: 'Dark Mage',
    level: 22,
    hp: { count: 23, sides: 6, plus: 12 },
    intents: [
      { intentId: 'OMNICURSE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Curse' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Darkblast' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Dark Ritual' },
    ],
    sprite: 'wizard.png',
    color: '#aa00aa',
  },
  
  DARK_MAGE_5: {
    id: 'DARK_MAGE_5',
    name: 'Dark Mage',
    level: 27,
    hp: { count: 28, sides: 6, plus: 13 },
    intents: [
      { intentId: 'OMNICURSE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Curse' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Darkblast' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Dark Ritual' },
    ],
    sprite: 'wizard.png',
    color: '#d500d5',
  },
  
  DARK_MAGE_6: {
    id: 'DARK_MAGE_6',
    name: 'Dark Mage',
    level: 32,
    hp: { count: 33, sides: 6, plus: 14 },
    intents: [
      { intentId: 'OMNICURSE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Curse' },
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Darkblast' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Dark Ritual' },
    ],
    sprite: 'wizard.png',
    color: '#ff00ff',
  },

  // skeleton warrior set: 3, 7, 11, 14, 19, 23, 27, 28
  SKELETON_WARRIOR_0: {
    id: 'SKELETON_WARRIOR_0',
    name: 'Skeleton Warrior',
    level: 3,
    strength: 0,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 4, sides: 6, plus: 10 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeleton.png',
    color: '#000000',
  },
  
  SKELETON_WARRIOR_1: {
    id: 'SKELETON_WARRIOR_1',
    name: 'Skeleton Warrior',
    level: 7,
    strength: 1,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 8, sides: 6, plus: 11 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeleton.png',
    color: '#1f1c17',
  },
  
  SKELETON_WARRIOR_2: {
    id: 'SKELETON_WARRIOR_2',
    name: 'Skeleton Warrior',
    level: 11,
    strength: 2,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 12, sides: 6, plus: 12 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeleton.png',
    color: '#3d392e',
  },
  
  SKELETON_WARRIOR_3: {
    id: 'SKELETON_WARRIOR_3',
    name: 'Skeleton Warrior',
    level: 14,
    strength: 3,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 14, sides: 6, plus: 13 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeleton.png',
    color: '#5c5545',
  },
  
  SKELETON_WARRIOR_4: {
    id: 'SKELETON_WARRIOR_4',
    name: 'Skeleton Warrior',
    level: 19,
    strength: 4,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 20, sides: 6, plus: 14 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeleton.png',
    color: '#7a725c',
  },
  
  SKELETON_WARRIOR_5: {
    id: 'SKELETON_WARRIOR_5',
    name: 'Skeleton Warrior',
    level: 23,
    strength: 5,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 24, sides: 6, plus: 15 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeleton.png',
    color: '#998e73',
  },
  
  SKELETON_WARRIOR_6: {
    id: 'SKELETON_WARRIOR_6',
    name: 'Skeleton Warrior',
    level: 27,
    strength: 6,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 28, sides: 6, plus: 16 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeleton.png',
    color: '#b7ab8a',
  },
  
  SKELETON_WARRIOR_7: {
    id: 'SKELETON_WARRIOR_7',
    name: 'Skeleton Warrior',
    level: 29,
    strength: 6,
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    hp: { count: 30, sides: 6, plus: 17 },
    intents: [
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Shield Bash' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Bone Beating' },
    ],
    sprite: 'skeletonwarrior.png',
    color: '#d6c7a1',
  },
  


  // mushroom legionnaire set: 2, 8, 14, 20, 26, 32, 38, 44
  MUSHROOM_LEGIONNAIRE_0: {
    id: 'MUSHROOM_LEGIONNAIRE_0',
    name: 'Mushroom Legionnaire',
    level: 2,
    sprite: 'mushroom.png',
    color: '#000000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 0,
    hp: { count: 3, sides: 6, plus: 10 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },
  
  MUSHROOM_LEGIONNAIRE_1: {
    id: 'MUSHROOM_LEGIONNAIRE_1',
    name: 'Mushroom Legionnaire',
    level: 8,
    sprite: 'mushroom.png',
    color: '#200000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 3,
    hp: { count: 9, sides: 6, plus: 16 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },
  
  MUSHROOM_LEGIONNAIRE_2: {
    id: 'MUSHROOM_LEGIONNAIRE_2',
    name: 'Mushroom Legionnaire',
    level: 14,
    sprite: 'mushroom.png',
    color: '#400000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 6,
    hp: { count: 15, sides: 6, plus: 22 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },
  
  MUSHROOM_LEGIONNAIRE_3: {
    id: 'MUSHROOM_LEGIONNAIRE_3',
    name: 'Mushroom Legionnaire',
    level: 20,
    sprite: 'mushroom.png',
    color: '#600000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 9,
    hp: { count: 21, sides: 6, plus: 28 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },
  
  MUSHROOM_LEGIONNAIRE_4: {
    id: 'MUSHROOM_LEGIONNAIRE_4',
    name: 'Mushroom Legionnaire',
    level: 26,
    sprite: 'mushroom.png',
    color: '#800000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 12,
    hp: { count: 27, sides: 6, plus: 34 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },
  
  MUSHROOM_LEGIONNAIRE_5: {
    id: 'MUSHROOM_LEGIONNAIRE_5',
    name: 'Mushroom Legionnaire',
    level: 32,
    sprite: 'mushroom.png',
    color: '#9f0000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 15,
    hp: { count: 33, sides: 6, plus: 40 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },
  
  MUSHROOM_LEGIONNAIRE_6: {
    id: 'MUSHROOM_LEGIONNAIRE_6',
    name: 'Mushroom Legionnaire',
    level: 38,
    sprite: 'mushroom.png',
    color: '#bf0000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 18,
    hp: { count: 39, sides: 6, plus: 46 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },
  
  MUSHROOM_LEGIONNAIRE_7: {
    id: 'MUSHROOM_LEGIONNAIRE_7',
    name: 'Mushroom Legionnaire',
    level: 44,
    sprite: 'mushroom.png',
    color: '#df0000',
    forceEnchantment: 'FIRE_RESISTANCE',
    strength: 21,
    hp: { count: 45, sides: 6, plus: 52 },
    intents: [
      { intentId: 'BLOW_SMOKE', choiceWeight: 1, alwaysFirst: true, neverRepeat: true, renameDisplayIntent: 'Spore Cloud' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Spore Shot' },
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Fungal Burst' },
    ],
  },

  // wyvern set: 2, 5, 8, 11, 13, 17, 20, 23, 26, 32
  WYVERN_0: {
    id: 'WYVERN_0',
    name: 'Wyvern',
    level: 2,
    strength: 1,
    sprite: 'wyvern.png',
    color: '#000000',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 3, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  WYVERN_1: {
    id: 'WYVERN_1',
    name: 'Wyvern',
    level: 5,
    strength: 4,
    sprite: 'wyvern.png',
    color: '#001a00',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 6, sides: 6, plus: 13 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_2: {
    id: 'WYVERN_2',
    name: 'Wyvern',
    level: 8,
    strength: 7,
    sprite: 'wyvern.png',
    color: '#003300',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 9, sides: 6, plus: 16 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_3: {
    id: 'WYVERN_3',
    name: 'Wyvern',
    level: 11,
    strength: 10,
    sprite: 'wyvern.png',
    color: '#004d00',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 12, sides: 6, plus: 19 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_4: {
    id: 'WYVERN_4',
    name: 'Wyvern',
    level: 13,
    strength: 12,
    sprite: 'wyvern.png',
    color: '#006600',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 14, sides: 6, plus: 22 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_5: {
    id: 'WYVERN_5',
    name: 'Wyvern',
    level: 17,
    strength: 16,
    sprite: 'wyvern.png',
    color: '#008000',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 18, sides: 6, plus: 25 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_6: {
    id: 'WYVERN_6',
    name: 'Wyvern',
    level: 20,
    strength: 19,
    sprite: 'wyvern.png',
    color: '#009900',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 21, sides: 6, plus: 28 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_7: {
    id: 'WYVERN_7',
    name: 'Wyvern',
    level: 23,
    strength: 22,
    sprite: 'wyvern.png',
    color: '#00b300',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 24, sides: 6, plus: 31 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_8: {
    id: 'WYVERN_8',
    name: 'Wyvern',
    level: 26,
    strength: 25,
    sprite: 'wyvern.png',
    color: '#00cc00',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 27, sides: 6, plus: 34 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_9: {
    id: 'WYVERN_9',
    name: 'Wyvern',
    level: 29,
    strength: 28,
    sprite: 'wyvern.png',
    color: '#00e600',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 30, sides: 6, plus: 37 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },
  
  WYVERN_10: {
    id: 'WYVERN_10',
    name: 'Wyvern',
    level: 32,
    strength: 31,
    sprite: 'wyvern.png',
    color: '#00ff00',
    forceEnchantment: 'POISON_RESISTANCE',
    hp: { count: 33, sides: 6, plus: 40 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Tail Whip' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Steam Breath' },
    ],
  },

  //glorb set: 4, 9, 12, 17, 22, 24, 28, 35, 39, 43
  GLORB_0: {
    id: 'GLORB_0',
    name: 'Glorb',
    level: 4,
    sprite: 'glorb.png',
    color: '#000000',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 1,
    hp: { count: 2, sides: 6, plus: 5 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_1: {
    id: 'GLORB_1',
    name: 'Glorb',
    level: 9,
    sprite: 'glorb.png',
    color: '#1c0210',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 2,
    hp: { count: 4, sides: 6, plus: 6 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_2: {
    id: 'GLORB_2',
    name: 'Glorb',
    level: 12,
    sprite: 'glorb.png',
    color: '#390521',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 3,
    hp: { count: 6, sides: 6, plus: 8 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_3: {
    id: 'GLORB_3',
    name: 'Glorb',
    level: 17,
    sprite: 'glorb.png',
    color: '#550731',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 4,
    hp: { count: 17, sides: 6, plus: 13 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_4: {
    id: 'GLORB_4',
    name: 'Glorb',
    level: 22,
    sprite: 'glorb.png',
    color: '#710942',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 5,
    hp: { count: 22, sides: 6, plus: 14 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_5: {
    id: 'GLORB_5',
    name: 'Glorb',
    level: 24,
    sprite: 'glorb.png',
    color: '#8e0b52',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 6,
    hp: { count: 24, sides: 6, plus: 15 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_6: {
    id: 'GLORB_6',
    name: 'Glorb',
    level: 28,
    sprite: 'glorb.png',
    color: '#aa0d62',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 7,
    hp: { count: 28, sides: 6, plus: 16 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_7: {
    id: 'GLORB_7',
    name: 'Glorb',
    level: 35,
    sprite: 'glorb.png',
    color: '#c70f73',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 8,
    hp: { count: 35, sides: 6, plus: 17 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_8: {
    id: 'GLORB_8',
    name: 'Glorb',
    level: 39,
    sprite: 'glorb.png',
    color: '#e31283',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 9,
    hp: { count: 39, sides: 6, plus: 18 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },
  
  GLORB_9: {
    id: 'GLORB_9',
    name: 'Glorb',
    level: 43,
    sprite: 'glorb.png',
    color: '#ff1493',
    forceEnchantment: 'BUNNY_RESIST',
    strength: 10,
    hp: { count: 43, sides: 6, plus: 19 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorble Glorb' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Glorb Slime' },
    ],
  },

  //witch set: 8, 13, 18, 21, 27, 34, 40, 44
  WITCH_0: {
    id: 'WITCH_0',
    name: 'Witch',
    level: 8,
    sprite: 'witch.png',
    color: '#000000',
    forceEnchantment: 'BUBBLE',
    hp: { count: 8, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  WITCH_1: {
    id: 'WITCH_1',
    name: 'Witch',
    level: 13,
    sprite: 'witch.png',
    color: '#220026',
    forceEnchantment: 'BUBBLE',
    hp: { count: 13, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  WITCH_2: {
    id: 'WITCH_2',
    name: 'Witch',
    level: 18,
    sprite: 'witch.png',
    color: '#44004d',
    forceEnchantment: 'BUBBLE',
    hp: { count: 18, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  WITCH_3: {
    id: 'WITCH_3',
    name: 'Witch',
    level: 21,
    sprite: 'witch.png',
    color: '#660073',
    forceEnchantment: 'BUBBLE',
    hp: { count: 21, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  WITCH_4: {
    id: 'WITCH_4',
    name: 'Witch',
    level: 27,
    sprite: 'witch.png',
    color: '#88009a',
    forceEnchantment: 'BUBBLE',
    hp: { count: 27, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  WITCH_5: {
    id: 'WITCH_5',
    name: 'Witch',
    level: 34,
    sprite: 'witch.png',
    color: '#aa00c0',
    forceEnchantment: 'BUBBLE',
    hp: { count: 34, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  WITCH_6: {
    id: 'WITCH_6',
    name: 'Witch',
    level: 40,
    sprite: 'witch.png',
    color: '#cc00e7',
    forceEnchantment: 'BUBBLE',
    hp: { count: 40, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },
  
  WITCH_7: {
    id: 'WITCH_7',
    name: 'Witch',
    level: 44,
    sprite: 'witch.png',
    color: '#d891ef',
    forceEnchantment: 'BUBBLE',
    hp: { count: 44, sides: 6, plus: 10 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Grand Conjuration' },
      { intentId: 'SMALL_SMOKE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Broom Sweep' },
      { intentId: 'AMPLIFY_DAMAGE', choiceWeight: 1, renameDisplayIntent: 'Hex', alwaysFirst: true, neverRepeat: true },
    ],
  },

  //mimic set levels: 14, 18, 22, 28, 33, 36, 41

  MIMIC_0: {
    id: 'MIMIC_0',
    name: 'Mimic',
    level: 14,
    forceEnchantment: 'GIANT_GROWTH',
    sprite: 'mimic.png',
    color: '#000000',
    strength: 1,
    hp: { count: 10, sides: 6, plus: 5 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' },
      { intentId: 'RUSTING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Tongue Lash' },
    ],
  },
  
  MIMIC_1: {
    id: 'MIMIC_1',
    name: 'Mimic',
    level: 18,
    forceEnchantment: 'GIANT_GROWTH',
    sprite: 'mimic.png',
    color: '#2a1609',
    strength: 1,
    hp: { count: 14, sides: 6, plus: 5 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' },
      { intentId: 'RUSTING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Tongue Lash' },
    ],
  },
  
  MIMIC_2: {
    id: 'MIMIC_2',
    name: 'Mimic',
    level: 22,
    forceEnchantment: 'GIANT_GROWTH',
    sprite: 'mimic.png',
    color: '#552b12',
    strength: 1,
    hp: { count: 18, sides: 6, plus: 5 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' },
      { intentId: 'RUSTING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Tongue Lash' },
    ],
  },
  
  MIMIC_3: {
    id: 'MIMIC_3',
    name: 'Mimic',
    level: 28,
    forceEnchantment: 'GIANT_GROWTH',
    sprite: 'mimic.png',
    color: '#7f411b',
    strength: 1,
    hp: { count: 24, sides: 6, plus: 5 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' },
      { intentId: 'RUSTING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Tongue Lash' },
    ],
  },
  
  MIMIC_4: {
    id: 'MIMIC_4',
    name: 'Mimic',
    level: 33,
    forceEnchantment: 'GIANT_GROWTH',
    sprite: 'mimic.png',
    color: '#aa5624',
    strength: 1,
    hp: { count: 29, sides: 6, plus: 5 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' },
      { intentId: 'RUSTING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Tongue Lash' },
    ],
  },
  
  MIMIC_5: {
    id: 'MIMIC_5',
    name: 'Mimic',
    level: 36,
    forceEnchantment: 'GIANT_GROWTH',
    sprite: 'mimic.png',
    color: '#d46c2d',
    strength: 1,
    hp: { count: 32, sides: 6, plus: 5 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' },
      { intentId: 'RUSTING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Tongue Lash' },
    ],
  },
  
  MIMIC_6: {
    id: 'MIMIC_6',
    name: 'Mimic',
    level: 41,
    forceEnchantment: 'GIANT_GROWTH',
    sprite: 'mimic.png',
    color: '#a0522d',
    strength: 1,
    hp: { count: 37, sides: 6, plus: 5 },
    intents: [
      { intentId: 'LARGE_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Bite' },
      { intentId: 'RUSTING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Tongue Lash' },
    ],
  },

  //pear hoplite set: 3, 7, 12, 17, 24, 29, 35, 42
  PEAR_HOPLITE_0: {
    id: 'PEAR_HOPLITE_0',
    name: 'Pear Hoplite',
    level: 3,
    sprite: 'pearHoplite.png',
    color: '#000000',
    strength: 1,
    hp: { count: 3, sides: 6, plus: 3 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },
  
  PEAR_HOPLITE_1: {
    id: 'PEAR_HOPLITE_1',
    name: 'Pear Hoplite',
    level: 7,
    sprite: 'pearHoplite.png',
    color: '#002400',
    strength: 2,
    hp: { count: 7, sides: 6, plus: 4 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },
  
  PEAR_HOPLITE_2: {
    id: 'PEAR_HOPLITE_2',
    name: 'Pear Hoplite',
    level: 12,
    sprite: 'pearHoplite.png',
    color: '#004900',
    strength: 3,
    hp: { count: 12, sides: 6, plus: 5 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },
  
  PEAR_HOPLITE_3: {
    id: 'PEAR_HOPLITE_3',
    name: 'Pear Hoplite',
    level: 17,
    sprite: 'pearHoplite.png',
    color: '#006d00',
    strength: 4,
    hp: { count: 17, sides: 6, plus: 6 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },
  
  PEAR_HOPLITE_4: {
    id: 'PEAR_HOPLITE_4',
    name: 'Pear Hoplite',
    level: 24,
    sprite: 'pearHoplite.png',
    color: '#009200',
    strength: 5,
    hp: { count: 24, sides: 6, plus: 7 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },
  
  PEAR_HOPLITE_5: {
    id: 'PEAR_HOPLITE_5',
    name: 'Pear Hoplite',
    level: 29,
    sprite: 'pearHoplite.png',
    color: '#00b600',
    strength: 6,
    hp: { count: 29, sides: 6, plus: 8 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },
  
  PEAR_HOPLITE_6: {
    id: 'PEAR_HOPLITE_6',
    name: 'Pear Hoplite',
    level: 35,
    sprite: 'pearHoplite.png',
    color: '#00db00',
    strength: 7,
    hp: { count: 35, sides: 6, plus: 9 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },
  
  PEAR_HOPLITE_7: {
    id: 'PEAR_HOPLITE_7',
    name: 'Pear Hoplite',
    level: 42,
    sprite: 'pearHoplite.png',
    color: '#00ff00',
    strength: 8,
    hp: { count: 42, sides: 6, plus: 10 },
    intents: [
      { intentId: 'MEDIUM_ATTACK', choiceWeight: 1, renameDisplayIntent: 'Pearpetrate Violence' },
      { intentId: 'MEDIUM_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Prepear' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'Pearilous Spear' },
    ],
  },

  // weird set: 10, 19, 25, 33, 37, 40, 43
  WEIRD_0: {
    id: 'WEIRD_0',
    name: 'Weird',
    level: 10,
    strength: 2,
    sprite: 'weird.png',
    color: '#000000',
    forceEnchantment: ['BUNNY_RESIST', 'POISON_RESIST', 'FIRE_RESIST'],
    hp: { count: 5, sides: 6, plus: 5 },
    intents: [
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Creep Out' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Lash' },
    ],
  },
  
  WEIRD_1: {
    id: 'WEIRD_1',
    name: 'Weird',
    level: 19,
    strength: 3,
    sprite: 'weird.png',
    color: '#2b1230',
    forceEnchantment: ['BUNNY_RESIST', 'POISON_RESIST', 'FIRE_RESIST'],    hp: { count: 10, sides: 6, plus: 14 },
    intents: [
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Creep Out' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Lash' },
    ],
  },
  
  WEIRD_2: {
    id: 'WEIRD_2',
    name: 'Weird',
    level: 25,
    strength: 4,
    sprite: 'weird.png',
    color: '#552360',
    forceEnchantment: ['BUNNY_RESIST', 'POISON_RESIST', 'FIRE_RESIST'],    hp: { count: 13, sides: 6, plus: 20 },
    intents: [
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Creep Out' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Lash' },
    ],
  },
  
  WEIRD_3: {
    id: 'WEIRD_3',
    name: 'Weird',
    level: 33,
    strength: 5,
    sprite: 'weird.png',
    color: '#80355a',
    forceEnchantment: ['BUNNY_RESIST', 'POISON_RESIST', 'FIRE_RESIST'],    hp: { count: 17, sides: 6, plus: 28 },
    intents: [
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Creep Out' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Lash' },
    ],
  },
  
  WEIRD_4: {
    id: 'WEIRD_4',
    name: 'Weird',
    level: 37,
    strength: 6,
    sprite: 'weird.png',
    color: '#aa4678',
    forceEnchantment: ['BUNNY_RESIST', 'POISON_RESIST', 'FIRE_RESIST'],    hp: { count: 19, sides: 6, plus: 32 },
    intents: [
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Creep Out' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Lash' },
    ],
  },
  
  WEIRD_5: {
    id: 'WEIRD_5',
    name: 'Weird',
    level: 40,
    strength: 7,
    sprite: 'weird.png',
    color: '#d55896',
    forceEnchantment: ['BUNNY_RESIST', 'POISON_RESIST', 'FIRE_RESIST'],    hp: { count: 20, sides: 6, plus: 35 },
    intents: [
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Creep Out' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Lash' },
    ],
  },
  
  WEIRD_6: {
    id: 'WEIRD_6',
    name: 'Weird',
    level: 43,
    strength: 8,
    sprite: 'weird.png',
    color: '#ff69b4',
    forceEnchantment: ['BUNNY_RESIST', 'POISON_RESIST', 'FIRE_RESIST'],    hp: { count: 22, sides: 6, plus: 38 },
    intents: [
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Creep Out' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Lash' },
    ],
  },

  // giant skull set: 19, 24, 28, 32, 36, 39, 42
  GIANT_SKULL_0: {
    id: 'GIANT_SKULL_0',
    name: 'Giant Skull',
    level: 19,
    sprite: 'giantSkull.png',
    color: '#000000',
    forceEnchantment: ['ANTI_MAGIC_SHELL', 'POISON_RESIST'],
    strength: 1,
    hp: { count: 20, sides: 6, plus: 30 },
    intents: [
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 2, renameDisplayIntent: 'BITE!' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Clamp' },
      { intentId: 'LARGE_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Ossify' },
    ],
  },
  
  GIANT_SKULL_1: {
    id: 'GIANT_SKULL_1',
    name: 'Giant Skull',
    level: 24,
    sprite: 'giantSkull.png',
    color: '#211f17',
    forceEnchantment: ['ANTI_MAGIC_SHELL', 'POISON_RESIST'],
    strength: 1,
    hp: { count: 30, sides: 6, plus: 40 },
    intents: [
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 2, renameDisplayIntent: 'BITE!' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Clamp' },
      { intentId: 'LARGE_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Ossify' },
    ],
  },
  
  GIANT_SKULL_2: {
    id: 'GIANT_SKULL_2',
    name: 'Giant Skull',
    level: 28,
    sprite: 'giantSkull.png',
    color: '#433e2e',
    forceEnchantment: ['ANTI_MAGIC_SHELL', 'POISON_RESIST'],
    strength: 1,
    hp: { count: 38, sides: 6, plus: 48 },
    intents: [
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 2, renameDisplayIntent: 'BITE!' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Clamp' },
      { intentId: 'LARGE_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Ossify' },
    ],
  },
  
  GIANT_SKULL_3: {
    id: 'GIANT_SKULL_3',
    name: 'Giant Skull',
    level: 32,
    sprite: 'giantSkull.png',
    color: '#645d45',
    forceEnchantment: ['ANTI_MAGIC_SHELL', 'POISON_RESIST'],
    strength: 1,
    hp: { count: 46, sides: 6, plus: 56 },
    intents: [
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 2, renameDisplayIntent: 'BITE!' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Clamp' },
      { intentId: 'LARGE_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Ossify' },
    ],
  },
  
  GIANT_SKULL_4: {
    id: 'GIANT_SKULL_4',
    name: 'Giant Skull',
    level: 36,
    sprite: 'giantSkull.png',
    color: '#857b5c',
    forceEnchantment: ['ANTI_MAGIC_SHELL', 'POISON_RESIST'],
    strength: 1,
    hp: { count: 54, sides: 6, plus: 64 },
    intents: [
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 2, renameDisplayIntent: 'BITE!' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Clamp' },
      { intentId: 'LARGE_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Ossify' },
    ],
  },
  
  GIANT_SKULL_5: {
    id: 'GIANT_SKULL_5',
    name: 'Giant Skull',
    level: 39,
    sprite: 'giantSkull.png',
    color: '#a79a73',
    forceEnchantment: ['ANTI_MAGIC_SHELL', 'POISON_RESIST'],
    strength: 1,
    hp: { count: 60, sides: 6, plus: 70 },
    intents: [
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 2, renameDisplayIntent: 'BITE!' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Clamp' },
      { intentId: 'LARGE_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Ossify' },
    ],
  },
  
  GIANT_SKULL_6: {
    id: 'GIANT_SKULL_6',
    name: 'Giant Skull',
    level: 42,
    sprite: 'giantSkull.png',
    color: '#c8b98a',
    forceEnchantment: ['ANTI_MAGIC_SHELL', 'POISON_RESIST'],
    strength: 1,
    hp: { count: 66, sides: 6, plus: 76 },
    intents: [
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 2, renameDisplayIntent: 'BITE!' },
      { intentId: 'WEAKENING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Clamp' },
      { intentId: 'LARGE_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Ossify' },
    ],
  },

  // golem set: 6, 9, 13, 17, 25, 34, 35, 37, 38, 41
  GOLEM_0: {
    id: 'GOLEM_0',
    name: 'Golem',
    level: 6,
    sprite: 'golem.png',
    color: '#000000',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 1,
    hp: { count: 8, sides: 6, plus: 8 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_1: {
    id: 'GOLEM_1',
    name: 'Golem',
    level: 9,
    sprite: 'golem.png',
    color: '#100802',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 2,
    hp: { count: 11, sides: 6, plus: 17 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_2: {
    id: 'GOLEM_2',
    name: 'Golem',
    level: 13,
    sprite: 'golem.png',
    color: '#1f0f04',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 3,
    hp: { count: 15, sides: 6, plus: 29 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_3: {
    id: 'GOLEM_3',
    name: 'Golem',
    level: 17,
    sprite: 'golem.png',
    color: '#2f1707',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 4,
    hp: { count: 19, sides: 6, plus: 41 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_4: {
    id: 'GOLEM_4',
    name: 'Golem',
    level: 25,
    sprite: 'golem.png',
    color: '#3e1f09',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 5,
    hp: { count: 27, sides: 6, plus: 65 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_5: {
    id: 'GOLEM_5',
    name: 'Golem',
    level: 34,
    sprite: 'golem.png',
    color: '#4e270b',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 6,
    hp: { count: 36, sides: 6, plus: 92 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_6: {
    id: 'GOLEM_6',
    name: 'Golem',
    level: 35,
    sprite: 'golem.png',
    color: '#5d2e0d',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 7,
    hp: { count: 37, sides: 6, plus: 95 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_7: {
    id: 'GOLEM_7',
    name: 'Golem',
    level: 37,
    sprite: 'golem.png',
    color: '#6d3610',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 8,
    hp: { count: 39, sides: 6, plus: 101 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_8: {
    id: 'GOLEM_8',
    name: 'Golem',
    level: 38,
    sprite: 'golem.png',
    color: '#7c3e11',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 9,
    hp: { count: 40, sides: 6, plus: 104 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
  GOLEM_9: {
    id: 'GOLEM_9',
    name: 'Golem',
    level: 41,
    sprite: 'golem.png',
    color: '#8b4513',
    forceEnchantment: 'ANTI_MAGIC_SHELL',
    strength: 10,
    hp: { count: 43, sides: 6, plus: 113 },
    intents: [
      { intentId: 'AMPLIFYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Golem Smush' },
      { intentId: 'SMALL_DIZZYING_BLOW', choiceWeight: 1, renameDisplayIntent: 'Rune Smash' },
      { intentId: 'SMALL_PREPARE', choiceWeight: 1, renameDisplayIntent: 'Gather Strength' },
      { intentId: 'SMALL_SHIELD_BASH', choiceWeight: 1, renameDisplayIntent: 'CRASH!' },
      { intentId: 'SMALL_FURY_SWIPES', choiceWeight: 1, renameDisplayIntent: 'Feet of Clay' },
      { intentId: 'SMALL_DEFEND', choiceWeight: 1, renameDisplayIntent: 'Guard' },
    ],
  },
  
}