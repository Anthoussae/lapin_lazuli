import type { DiceSpec } from '../rng/dice'
import type { RngState } from '../rng/rng'
import type { CardId, CardInstanceId, EnemyId, EnemyInstanceId, GemId, PathId, RelicId } from './ids'
import type { AnimState } from '../../animation/types'
import type { InputState } from '../../input/types'
import type { EnemyBoonId } from '../../data/enemyBoons'

export type Phase =
  | 'BOOT'
  | 'TITLE'
  | 'RELIC_SELECT_STARTER'
  | 'PATH_SELECT'
  | 'MAP'
  | 'COMBAT_PLAYER_READY'
  | 'COMBAT_RESOLVING'
  | 'COMBAT_SELECT_HAND_CARD'
  | 'ANIMATING'
  | 'REWARD'
  | 'REST'
  | 'SHOP'
  | 'TREASURE_ROOM'
  | 'GEMSTONE_CAVERN'
  | 'DEFEAT'
  | 'GAME_WIN'
  | 'EVENT'

export type Zone = 'DRAW' | 'HAND' | 'DISCARD'

export type CardInstance = Readonly<{
  id: CardInstanceId
  templateId: CardId
  upgrades: number
  exhausted: boolean
  costOverride: number | null
  socketedGemId: GemId | null
  /** When true, this instance cannot receive a gem (templates or prior socketing). */
  unsocketable: boolean
}>

export type RelicInstance = Readonly<{
  id: string
  templateId: RelicId
  counters: Readonly<Record<string, number>>
}>

export type RelicSelectionState = Readonly<{
  category: 'STARTER_RELICS'
  offered: ReadonlyArray<RelicId>
}>

/** Treasure room: three relic choices (shop-style roll), then proceed after the player picks one. */
export type TreasureRoomState = Readonly<{
  offered: ReadonlyArray<RelicId>
  /** True after the player chose a relic (others cleared). */
  selectionComplete: boolean
}>

export type GemstoneSocketingState = Readonly<{
  gemId: GemId
  selectedCardInstanceId: CardInstanceId | null
}>

export type GemstoneCavernState = Readonly<{
  offered: ReadonlyArray<GemId>
  socketing: GemstoneSocketingState | null
}>

/** Rolled encounter shown on the path picker (committed when the player chooses that slot). */
export type PathCombatPreview = Readonly<{
  enemyTemplateId: EnemyId
  maxHp: number
  boons: ReadonlyArray<EnemyBoonId>
}>

export type PathSelectionState = Readonly<{
  offered: ReadonlyArray<PathId>
  /** Same length as `offered`; true = path still needs a key before it can be chosen. */
  slotLocked: ReadonlyArray<boolean>
  /** Same length as `offered`; rolled enemy + HP for combat paths, null otherwise. */
  combatPreviews: ReadonlyArray<PathCombatPreview | null>
}>

/** Post-combat reward screen: card draft or relic draft (miniboss). */
export type CardRewardState = Readonly<
  | {
      kind: 'CARD'
      offered: ReadonlyArray<Readonly<{ cardId: CardId; upgrades: number }>>
      goldEarned: number
      /** Key drops use path rules + luck (non-combat rewards use 0). */
      keysEarned: number
      /** Victory gold is applied on `REWARD/PICK_GOLD`; true when none offered or already collected. */
      goldPickedUp: boolean
      keysPickedUp: boolean
    }
  | {
      kind: 'RELIC'
      offered: ReadonlyArray<RelicId>
      goldEarned: number
      keysEarned: number
      goldPickedUp: boolean
      keysPickedUp: boolean
    }
>

export type ShopItem = Readonly<
  | { kind: 'RELIC'; relicId: RelicId; price: number; sold: boolean }
  | { kind: 'CARD'; cardId: CardId; upgrades: number; price: number; sold: boolean }
  | { kind: 'KEY'; price: number; sold: boolean }
>

export type ShopState = Readonly<{
  items: ReadonlyArray<ShopItem>
}>

export type DefeatState = Readonly<{
  enemyName: string
  level: number
}>

export type EnemyInstance = Readonly<{
  id: EnemyInstanceId
  templateId: EnemyId
  hp: number
  maxHp: number
  /** Absorbs damage before HP; cleared when combat ends. */
  shield: number
  /** Absorbs damage after temporary shield; persists for the rest of combat. */
  lockedShield: number
  boons: ReadonlyArray<EnemyBoonId>
  /** Each point adds 1 to damage when this enemy performs an ATTACK. */
  strength: number
  intent: EnemyIntent | null
  /** Next step index for enemies that use `intentScript` (cycles each intent roll). */
  scriptIntentIndex: number
  powers: Readonly<Record<string, number>>
}>

/** Extra outcomes on an enemy intent (e.g. gain strength after charging or on hit). */
export type EnemyIntentExtraEffect = Readonly<
  | { effect: 'strengthgain'; value: number }
  | { effect: 'playerTurnStartBunnyDrain'; amount: number }
  | { effect: 'enemyLockedShieldGain'; amount: number }
  | { effect: 'enemyLockedShieldGain'; roll: DiceSpec }
  /** On attack hit, restore the attacker's HP by unshielded damage dealt to the player. */
  | { effect: 'vampiric' }
  /** Create card instances and shuffle them into the player's draw pile. */
  | { effect: 'shuffleBurdenIntoDeck'; cardId: CardId; count: number }
>

export type EnemyIntentEffects = ReadonlyArray<EnemyIntentExtraEffect>

/** Rolled enemy move shown to the player and resolved on the enemy turn. */
export type EnemyIntent = Readonly<
  | { kind: 'WAIT' }
  | { kind: 'ATTACK'; intentName: string; damage: number; effects?: EnemyIntentEffects }
  | { kind: 'BUFF'; intentName: string; effects: EnemyIntentEffects }
  | { kind: 'DEBUFF'; intentName: string; effects: EnemyIntentEffects }
>

export type PlayerState = Readonly<{
  hp: number
  maxHp: number
  /** Temporary shield; cleared at the start of each player turn and when combat ends. */
  shield: number
  /** Shield that persists across player turns and combat entry; cleared only when combat ends. */
  lockedShield: number
  keys: number
  energy: number
  maxEnergy: number
  gold: number
  bunnies: number
  power: number
  /** Multiplier for damage on cards tagged fire and damage; 0 means no bonus. */
  firepowerMultiplier: number
  luck: number
  upgradeChance: number
  /** Baseline cards drawn when the combat hand is refreshed (before combat-only modifiers like Meddling). */
  baseHandSize: number
  /** Display / legacy; keep aligned with upgrades that change draw size. Combat draws use baseHandSize + combat modifiers. */
  handSize: number
  /** Monotonic serial for new card instances (`c0`, `c1`, …); avoids collisions when deck size changes. */
  nextCardInstanceSerial: number
  deck: Readonly<{
    cardById: Readonly<Record<CardInstanceId, CardInstance>>
    drawPile: ReadonlyArray<CardInstanceId>
    hand: ReadonlyArray<CardInstanceId>
    discardPile: ReadonlyArray<CardInstanceId>
  }>
  relics: ReadonlyArray<RelicInstance>
}>

export type HandSelectionState = Readonly<{
  kind: 'UPGRADE_SELECTED_CARD' | 'CONSUME_SELECTED_CARD'
  playedCardInstanceId: CardInstanceId
  cost: number
  numberOfTargets: number
  upgradeAmount: number
  /** Snapshot of other cards in hand while the played card is pending selection. */
  eligibleIds: ReadonlyArray<CardInstanceId>
  chosenIds: ReadonlyArray<CardInstanceId>
}>

export type CombatState = Readonly<{
  id: string
  turn: number
  /** Path node used to start this fight (easy/medium/hard); null if combat was not entered from path select. */
  combatEntryPathId: PathId | null
  /** Added to {@link PlayerState.baseHandSize} when drawing the player's combat hand each turn (typically negative from Meddling). */
  handDrawDelta: number
  /** Added to {@link PlayerState.maxEnergy} for combat ink cap (typically negative from Ink-drinking). */
  maxEnergyDelta: number
  /** Bunnies lost at each player turn start from enemy attack effects (e.g. Stinky Tofu). */
  playerTurnStartBunnyDrain: number
  enemies: Readonly<{
    enemyById: Readonly<Record<EnemyInstanceId, EnemyInstance>>
    aliveIds: ReadonlyArray<EnemyInstanceId>
  }>
  targeting: Readonly<{
    selectedEnemyId: EnemyInstanceId | null
  }>
  handSelection: HandSelectionState | null
}>

export type UiState = Readonly<{
  anim: AnimState
  input: InputState
  debug: Readonly<{
    lastEvents: ReadonlyArray<string>
  }>
}>

export type RestOutcomeState = Readonly<{
  healedHp: number
}>

export type GameState = Readonly<{
  v: 1
  seed: number
  rng: RngState
  level: number
  phase: Phase
  phasePrev: Phase | null
  assets: Readonly<{
    status: 'UNLOADED' | 'LOADING' | 'READY' | 'ERROR'
    loaded: ReadonlyArray<string>
    failed: ReadonlyArray<string>
  }>
  player: PlayerState
  /**
   * Path id that started the current combat (from path selection / `startCombat`). Mirrors
   * `combat.combatEntryPathId` and is the source of truth for post-combat rules (e.g. key chance).
   * Cleared when combat ends in victory; null for combats not started from a path (e.g. debug).
   */
  currentCombatPathId: PathId | null
  combat: CombatState | null
  relicSelection: RelicSelectionState | null
  /** Populated while phase is `TREASURE_ROOM`. */
  treasureRoom: TreasureRoomState | null
  /** Populated while phase is `GEMSTONE_CAVERN`. */
  gemstoneCavern: GemstoneCavernState | null
  pathSelection: PathSelectionState | null
  cardReward: CardRewardState | null
  /** Stock for the current SHOP visit (9 slots). */
  shop: ShopState | null
  /** Set while phase is REST so the UI can show how much HP was restored. */
  restOutcome: RestOutcomeState | null
  /**
   * Paths with cooldown: minimum game level before this path id may appear in offerings again
   * (set to selectedLevel + path.cooldown when the player picks that path).
   */
  pathCooldownUntil: Readonly<Partial<Record<PathId, number>>>
  defeat: DefeatState | null
  ui: UiState
}>
