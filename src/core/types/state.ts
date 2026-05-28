import type { DiceSpec } from '../rng/dice'
import type { RngState } from '../rng/rng'
import type { CardId, CardInstanceId, EnemyId, EnemyInstanceId, GemId, PathId, RelicId } from './ids'
import type { AnimState } from '../../animation/types'
import type { InputState } from '../../input/types'
import type { EnemyBoonId } from '../../data/enemyBoons'
import type { MysteryRoomId } from '../../data/mysteryRooms'
import type { EnemyIntentKind } from '../../data/enemyIntentKinds'
import type { EnchantmentInstance } from './enchantments'

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
  /** Foil: +50% (rounded up) to effect amounts after upgrades and to upgradeValues before upgrades. */
  foil?: boolean
  /** Sticker modification (not yet implemented in gameplay). */
  sticker?: boolean
  /** Instance gains Expire (e.g. Copper Alembics combat potion). */
  grantedExpire?: boolean
  /** Removed from the deck when combat ends; never kept in the run deck. */
  combatEphemeral?: boolean
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

/** Treasure room: three relic choices (shop-style roll); picking one advances to the next path screen. */
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

/** Font of Lethe event — pick a deck card to permanently remove. */
export type FontOfLetheState = Readonly<{
  selectedCardInstanceId: CardInstanceId | null
  cardForgotten: boolean
}>

/** The Printer — foil one card or duplicate one card, then proceed. */
export type PrinterState = Readonly<{
  selectedCardInstanceId: CardInstanceId | null
  duplicateSelectedCardInstanceId: CardInstanceId | null
  cardFoiled: boolean
  cardDuplicated: boolean
}>

/** The Collector — offers to buy the player's best card or trade bulk cards. */
export type CollectorState = Readonly<{
  offeredCardInstanceId: CardInstanceId | null
  /** True after the pull-from-deck reveal animation finishes (or when no card to offer). */
  cardRevealed: boolean
  /** Rolled when the room is entered (inclusive range; see collector event). */
  sellPrice: number
  /** True after the player sold the offered card and received {@link sellPrice} gold. */
  sold: boolean
  /** True after the player chose bulk cards (mutually exclusive with {@link sold}). */
  bulkAccepted: boolean
  /** Rolled on accept; same shape as card reward offers. */
  bulkCards: ReadonlyArray<Readonly<{ cardId: CardId; upgrades: number; foil?: boolean }>> | null
  /** Count of {@link bulkCards} instances added to the deck after travel FX. */
  bulkCardsAdded: number
}>

/** Populated while phase is `EVENT` (Mystery path: rolled room behind the door). */
export type MysteryRoomState = Readonly<{
  roomId: MysteryRoomId
  fontOfLethe?: FontOfLetheState
  printer?: PrinterState
  collector?: CollectorState
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
      offered: ReadonlyArray<Readonly<{ cardId: CardId; upgrades: number; foil?: boolean }>>
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
  | { kind: 'WAIT'; intentKind: EnemyIntentKind }
  | {
      kind: 'ATTACK'
      intentKind: EnemyIntentKind
      intentName: string
      damage: number
      effects?: EnemyIntentEffects
    }
  | { kind: 'BUFF'; intentKind: EnemyIntentKind; intentName: string; effects: EnemyIntentEffects }
  | { kind: 'DEBUFF'; intentKind: EnemyIntentKind; intentName: string; effects: EnemyIntentEffects }
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
  /** Bonus temporary shield from cards tagged addShield. */
  shieldPower: number
  /** Flat bonus damage on cards tagged fire and damage. */
  firepower: number
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

/** Queued burden grant shown with card-to-deck FX before mutating the deck. */
export type BurdenAddEntry = Readonly<{
  /** Stable identity for animation keys while the queue shifts. */
  id: string
  cardId: CardId
  upgrades: number
  zone: 'draw' | 'discard'
  /** Enemy applying the burden (combat FX origin); null uses the default preview slot. */
  sourceEnemyId: EnemyInstanceId | null
}>

/** Stat bonuses from relics or cards that apply only for the current combat. */
export type CombatBonuses = Readonly<{
  power: number
  firepower: number
  shieldPower: number
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
  /** True while the bunny-release animation plays before damage resolves. */
  bunnyReleasePending: boolean
  /** Puff sprites to spawn for the in-flight release (0 when not pending). */
  bunnyReleaseSpriteCount: number
  /** Enemy receiving bunny damage this release; null if none. */
  bunnyReleaseTargetEnemyId: EnemyInstanceId | null
  /** Enemy playing defeat FX (hp 0, still in `aliveIds` until FX completes). */
  monsterDefeatPending: EnemyInstanceId | null
  /** Player playing defeat FX before the defeat screen. */
  playerDefeatPending: boolean
  /** True after enemy turn until the post-discard hand draw runs (separate from discard for animations). */
  pendingTurnStartDraw: boolean
  /** Burden cards waiting for add-to-deck/discard FX (applied front-to-back). */
  burdenAddQueue: ReadonlyArray<BurdenAddEntry>
  /** Monotonic serial for burden add queue ids (`b1`, `b2`, …). */
  nextBurdenAddSerial: number
  /** Opening hand draw deferred until {@link burdenAddQueue} is empty (Alchemist lead ingots, etc.). */
  pendingOpeningHandDraw: Readonly<{ bonusDraw: number }> | null
  /**
   * Phoenix-feather Quill: first fire spell each combat costs 0 ink.
   * Set at combat start when the relic is owned; cleared when a fire-tagged card is played.
   */
  freeFirstFireSpell: boolean
  /**
   * Paintbrush: the fifth spell each player turn costs 0 ink.
   * When true, all cards display as 0 ink (green) and the next successfully cast card costs 0.
   */
  nextSpellCosts0: boolean
  /** Paintbrush: number of cards successfully cast this player turn (does not reset until turn end). */
  cardsPlayedThisTurn: number
  /** Paintbrush: gate to ensure the discount triggers only once per turn (on the 4th cast). */
  paintbrushTriggeredThisTurn: boolean
  /** Relic/card stat bonuses that expire when this combat ends. */
  combatBonuses: CombatBonuses
  /** True after the player takes unblocked HP damage this combat (first-hit relic triggers). */
  playerTookUnblockedDamage: boolean
  /**
   * Cards that are temporarily removed from all zones until combat ends (enchantment cards).
   * They phase out on play and phase back in at combat end without counting as deck add/remove.
   */
  phasedOut: ReadonlyArray<CardInstanceId>
  /** Active combat-only enchantments; cleared when the fight ends. */
  enchantments: ReadonlyArray<EnchantmentInstance>
  /** Monotonic serial for new enchantment instances (`ench0`, `ench1`, …). */
  nextEnchantmentInstanceSerial: number
}>

export type UiState = Readonly<{
  anim: AnimState
  input: InputState
  debug: Readonly<{
    lastEvents: ReadonlyArray<string>
  }>
}>

export type RestOutcomeState = Readonly<{
  /** HP Sleep will restore (computed on enter; capped at missing HP). */
  sleepHealAmount: number
  /** True after the player uses Sleep. */
  slept: boolean
  /** True after the player uses Study. */
  studied: boolean
  /** HP restored by Sleep (set when {@link slept} becomes true). */
  healedHp?: number
  /** Card upgraded by Study, if any upgradeable card was in the deck. */
  studiedCardInstanceId?: CardInstanceId
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
  /**
   * Path id for the room the player is currently in (map choice through leave/reward).
   * Cleared when returning to path selection; used for room name/description HUD.
   */
  activeRoomPathId: PathId | null
  combat: CombatState | null
  relicSelection: RelicSelectionState | null
  /** Populated while phase is `TREASURE_ROOM`. */
  treasureRoom: TreasureRoomState | null
  /** Populated while phase is `GEMSTONE_CAVERN`. */
  gemstoneCavern: GemstoneCavernState | null
  /** Populated while phase is `EVENT` (Mystery path). */
  mysteryRoom: MysteryRoomState | null
  pathSelection: PathSelectionState | null
  cardReward: CardRewardState | null
  /** Stock for the current SHOP visit (9 slots). */
  shop: ShopState | null
  /** Populated while phase is REST (sleep heal preview, then outcome after Sleep). */
  restOutcome: RestOutcomeState | null
  /**
   * Paths with cooldown: minimum game level before this path id may appear in offerings again
   * (set to selectedLevel + path.cooldown when the player picks that path).
   */
  pathCooldownUntil: Readonly<Partial<Record<PathId, number>>>
  /**
   * Mystery rooms with cooldown: minimum game level before this room id may be rolled again
   * (set to selectedLevel + room.cooldown when the player picks a mystery path).
   */
  mysteryRoomCooldownUntil: Readonly<Partial<Record<MysteryRoomId, number>>>
  defeat: DefeatState | null
  ui: UiState
}>
