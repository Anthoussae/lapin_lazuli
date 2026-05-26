import type { GameState } from '../../core/types/state'
import type { GameAction, PlayerAction } from '../actions'
import type { GameEvent } from '../events'
import { isPlayerAction, setPhase } from '../reduceGame'
import { isActionLegalNow } from './phaseGating'
import { startCombat } from '../../systems/combat/startCombat'
import { playCard } from '../../systems/combat/playCard'
import { cancelHandSelection, pickHandSelectionCard, submitHandSelection } from '../../systems/combat/handSelection'
import { completeBurdenAdd } from '../../systems/combat/burdenAdd'
import { endPlayerTurn, completeBunnyRelease, completeTurnStartDraw } from '../../systems/combat/turns'
import { completeMonsterDefeat } from '../../systems/combat/monsterDefeat'
import { completePlayerDefeat } from '../../systems/combat/playerDefeat'
import { selectTarget } from '../../systems/combat/targeting'
import { rngFromSeed, rngInt } from '../../core/rng/rng'
import { StarterRelicPool, isRelicOfferable } from '../../data/relics'
import type { PathCombatPreview, PathSelectionState } from '../../core/types/state'
import type { CardId, CardInstanceId, PathId, RelicId } from '../../core/types/ids'
import { mkCardInstance, mkRelicInstance } from '../../systems/factories'
import { buildStarterDeck } from '../../data/cards'
import { PathPool, Paths } from '../../data/paths'
import type { MysteryRoomId } from '../../data/mysteryRooms'
import { mkMysteryRoomState, MysteryRooms, mysteryRoomIsEvent, mysteryRoomPathId, rollMysteryRoom } from '../../data/mysteryRooms'
import {
  applyCollectorAcceptBulk,
  applyCollectorAddBulkCard,
  applyCollectorSell,
  collectorCanProceed,
  initCollectorMysteryRoom,
  revealCollectorOfferedCard,
} from '../../systems/events/collector'
import { forgetFontOfLetheCard, fontOfLetheCanProceed, selectFontOfLetheCard } from '../../systems/events/fontOfLethe'
import {
  duplicatePrinterCard,
  foilPrinterCard,
  printerCanProceed,
  selectPrinterCard,
  selectPrinterDuplicateCard,
} from '../../systems/events/printer'
import { determineLocks } from '../../systems/paths/determineLocks'
import { isCombatPath, rollPathCombatEncounter } from '../../systems/paths/rollPathCombat'
import { populateCardReward } from '../../systems/rewards/cardRewards'
import { isRewardLootFullyCollected } from '../../systems/rewards/rewardLoot'
import { pickThreeShopRelics, populateShop } from '../../systems/shop/populateShop'
import { assignShopPrices } from '../../systems/shop/assignPrice'
import { applyCardPickupEffects } from '../../systems/cards/pickupEffects'
import { applyRelicTriggers } from '../../systems/relics/triggers'
import { computeSleepHealAmount } from '../../systems/rest/sleepHeal'
import { applyRandomStudyUpgrade, restChoiceMade } from '../../systems/rest/studyUpgrade'
import { rollGemOffers } from '../../systems/gems/rollGems'
import {
  confirmGemstoneSocketing,
  deckHasSocketableCard,
  pickGemstoneCavernGem,
  skipGemstoneSocketing,
  toggleGemstoneSocketingCard,
} from '../../systems/gems/socketing'
import { initialState } from '../initialState'

export function applyAction(state: GameState, action: GameAction): { state: GameState; events: GameEvent[] } {
  if (action.type === 'BOOT/START') {
    if (state.assets.status !== 'UNLOADED') return { state, events: [] }
    const s2: GameState = { ...state, assets: { ...state.assets, status: 'LOADING' } }
    return { state: s2, events: [] }
  }

  if (action.type === 'BOOT/ASSETS_READY') {
    const status = action.failed.length ? 'ERROR' : 'READY'
    const s2: GameState = { ...state, assets: { status, loaded: action.loaded, failed: action.failed } }
    if (status === 'READY') return { state: setPhase(s2, 'TITLE'), events: [] }
    return { state: s2, events: [] }
  }

  if (action.type === 'COMBAT/COMPLETE_BUNNY_RELEASE') {
    return completeBunnyRelease(state)
  }

  if (action.type === 'COMBAT/COMPLETE_MONSTER_DEFEAT') {
    return completeMonsterDefeat(state)
  }

  if (action.type === 'COMBAT/COMPLETE_PLAYER_DEFEAT') {
    return completePlayerDefeat(state)
  }

  if (action.type === 'COMBAT/COMPLETE_TURN_START_DRAW') {
    return completeTurnStartDraw(state)
  }

  if (action.type === 'COMBAT/COMPLETE_BURDEN_ADD') {
    return completeBurdenAdd(state)
  }

  if (isPlayerAction(action)) {
    if (!isActionLegalNow(state, action)) return { state, events: [] }
    return applyPlayerAction(state, action)
  }

  return { state, events: [] }
}

function applyPlayerAction(state: GameState, action: PlayerAction): { state: GameState; events: GameEvent[] } {
  switch (action.type) {
    case 'TITLE/NEW_GAME':
      return { state: startStarterRelicSelection(state), events: [] }
    case 'TITLE/MAIN_MENU':
      return { state: resetToTitle(state), events: [] }
    case 'RELIC/CHOOSE_STARTER':
      return { state: chooseStarterRelic(state, action.relicId), events: [] }
    case 'PATH/CHOOSE':
      return choosePath(state, action.pathId, action.slotIndex)
    case 'PATH/UNLOCK_SLOT':
      return { state: unlockPathSlot(state, action.slotIndex), events: [] }
    case 'MAP/START_COMBAT':
      return startCombat(state, 'CARROT_GOBLIN', null)
    case 'COMBAT/SELECT_TARGET':
      return selectTarget(state, action.enemyId)
    case 'COMBAT/PLAY_CARD':
      return playCard(state, action.cardInstanceId)
    case 'COMBAT/CANCEL_HAND_SELECTION':
      return cancelHandSelection(state)
    case 'COMBAT/PICK_HAND_SELECTION_CARD':
      return pickHandSelectionCard(state, action.cardInstanceId)
    case 'COMBAT/SUBMIT_HAND_SELECTION':
      return submitHandSelection(state)
    case 'COMBAT/END_TURN':
      return endPlayerTurn(state)
    case 'REWARD/PICK_CARD':
      return pickRewardCard(state, action.cardId)
    case 'REWARD/PICK_RELIC':
      return pickRewardRelic(state, action.relicId)
    case 'REWARD/PICK_GOLD':
      return pickRewardGold(state)
    case 'REWARD/PICK_KEYS':
      return pickRewardKeys(state)
    case 'REST/SLEEP':
      return restSleep(state)
    case 'REST/STUDY':
      return restStudy(state)
    case 'REST/CONTINUE':
      return continueAfterRest(state)
    case 'TREASURE_ROOM/PICK_RELIC': {
      const next = pickTreasureRoomRelic(state, action.relicId)
      if (next === state) return { state, events: [] }
      return continueAfterTreasureRoom(next)
    }
    case 'SHOP/LEAVE':
      return continueAfterShop(state)
    case 'SHOP/BUY_ITEM':
      return buyShopItem(state, action.slotIndex)
    case 'GEMSTONE_CAVERN/PROCEED':
      return continueAfterGemstoneCavern(state)
    case 'GEMSTONE_CAVERN/PICK_GEM':
      return { state: pickGemstoneCavernGem(state, action.gemId), events: [] }
    case 'GEMSTONE_CAVERN/SKIP_SOCKETING':
      return { state: skipGemstoneSocketing(state), events: [] }
    case 'GEMSTONE_CAVERN/SELECT_SOCKET_CARD':
      return { state: toggleGemstoneSocketingCard(state, action.cardInstanceId), events: [] }
    case 'GEMSTONE_CAVERN/CONFIRM_SOCKETING': {
      const next = confirmGemstoneSocketing(state)
      if (next === state) return { state, events: [] }
      return continueAfterGemstoneCavern(next)
    }
    case 'EVENT/PROCEED':
      return continueAfterMysteryRoom(state)
    case 'FONT_OF_LETHE/SELECT_CARD':
      return { state: selectFontOfLetheCard(state, action.cardInstanceId), events: [] }
    case 'FONT_OF_LETHE/FORGET':
      return { state: forgetFontOfLetheCard(state), events: [] }
    case 'PRINTER/SELECT_CARD':
      return { state: selectPrinterCard(state, action.cardInstanceId), events: [] }
    case 'PRINTER/FOIL':
      return { state: foilPrinterCard(state), events: [] }
    case 'PRINTER/SELECT_DUPLICATE_CARD':
      return { state: selectPrinterDuplicateCard(state, action.cardInstanceId), events: [] }
    case 'PRINTER/DUPLICATE':
      return { state: duplicatePrinterCard(state), events: [] }
    case 'COLLECTOR/REVEAL_OFFERED_CARD':
      return { state: revealCollectorOfferedCard(state), events: [] }
    case 'COLLECTOR/SELL':
      return { state: applyCollectorSell(state), events: [] }
    case 'COLLECTOR/ACCEPT_BULK':
      return { state: applyCollectorAcceptBulk(state), events: [] }
    case 'COLLECTOR/ADD_BULK_CARD':
      return { state: applyCollectorAddBulkCard(state, action.index), events: [] }
  }
}

function resetToTitle(state: GameState): GameState {
  const assets = state.assets
  const s0 = initialState(state.seed)
  const s1: GameState = { ...s0, assets, phase: assets.status === 'READY' ? 'TITLE' : 'BOOT', phasePrev: null }
  return s1
}

function pickRewardGold(state: GameState): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'REWARD') return { state, events: [] }
  const rw = state.cardReward
  if (!rw || rw.goldEarned <= 0 || rw.goldPickedUp) return { state, events: [] }
  return {
    state: {
      ...state,
      cardReward: { ...rw, goldPickedUp: true },
      player: { ...state.player, gold: state.player.gold + rw.goldEarned },
    },
    events: [],
  }
}

function pickRewardKeys(state: GameState): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'REWARD') return { state, events: [] }
  const rw = state.cardReward
  if (!rw || rw.keysEarned <= 0 || rw.keysPickedUp) return { state, events: [] }
  return {
    state: {
      ...state,
      cardReward: { ...rw, keysPickedUp: true },
      player: { ...state.player, keys: state.player.keys + rw.keysEarned },
    },
    events: [],
  }
}

function pickRewardCard(state: GameState, cardId: CardId): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'REWARD') return { state, events: [] }
  const rw = state.cardReward
  if (!rw || rw.kind !== 'CARD' || !isRewardLootFullyCollected(rw)) return { state, events: [] }
  const offer = rw.offered.find((o) => o.cardId === cardId)
  if (!offer) return { state, events: [] }

  // Add a new instance of the chosen card to the player's deck (out of combat).
  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = mkCardInstance(newId, cardId, offer.upgrades)
  const cardById2 = { ...state.player.deck.cardById, [inst.id]: inst }
  const drawPile2 = [...state.player.deck.drawPile, inst.id]

  const nextLevel = state.level + 1
  let rng = state.rng
  const rolled = rollPaths(rng, nextLevel, 3, state.pathCooldownUntil, { ...state.player.deck, cardById: cardById2 })
  const pathPick = buildPathSelection(rolled.rng, rolled.offered, nextLevel)

  let s2: GameState = {
    ...state,
    level: nextLevel,
    rng: pathPick.rng,
    player: {
      ...state.player,
      nextCardInstanceSerial: serial + 1,
      deck: { ...state.player.deck, cardById: cardById2, drawPile: drawPile2 },
    },
    cardReward: null,
    restOutcome: null,
    defeat: null,
    treasureRoom: null,
    gemstoneCavern: null,
    mysteryRoom: null,
    pathSelection: pathPick.pathSelection,
    activeRoomPathId: null,
  }

  s2 = applyCardPickupEffects(s2, cardId)

  return { state: setPhase(s2, 'PATH_SELECT'), events: [] }
}

function pickRewardRelic(state: GameState, relicId: RelicId): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'REWARD') return { state, events: [] }
  const rw = state.cardReward
  if (!rw || rw.kind !== 'RELIC' || !isRewardLootFullyCollected(rw)) return { state, events: [] }
  if (!rw.offered.includes(relicId)) return { state, events: [] }

  const nextIdx = state.player.relics.length + 1
  const inst = mkRelicInstance(`rb${nextIdx}`, relicId)
  let sPickup: GameState = {
    ...state,
    player: { ...state.player, relics: [...state.player.relics, inst] },
    cardReward: null,
    restOutcome: null,
    defeat: null,
    treasureRoom: null,
    shop: null,
    gemstoneCavern: null,
    mysteryRoom: null,
  }
  sPickup = applyRelicTriggers(sPickup, relicId, 'onPickup')

  const nextLevel = state.level + 1
  let rng = sPickup.rng
  const rolled = rollPaths(rng, nextLevel, 3, sPickup.pathCooldownUntil, sPickup.player.deck)
  const pathPick = buildPathSelection(rolled.rng, rolled.offered, nextLevel)

  const s2: GameState = {
    ...sPickup,
    level: nextLevel,
    rng: pathPick.rng,
    pathSelection: pathPick.pathSelection,
    activeRoomPathId: null,
  }

  return { state: setPhase(s2, 'PATH_SELECT'), events: [] }
}

function buyShopItem(state: GameState, slotIndex: number): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'SHOP') return { state, events: [] }
  const shop = state.shop
  if (!shop || slotIndex < 0 || slotIndex >= shop.items.length) return { state, events: [] }
  const item = shop.items[slotIndex]
  if (item.sold) return { state, events: [] }
  if (state.player.gold < item.price) return { state, events: [] }

  const gold = state.player.gold - item.price
  const items = shop.items.map((it, i) => (i === slotIndex ? { ...it, sold: true as const } : it))

  if (item.kind === 'RELIC') {
    const nextIdx = state.player.relics.length + 1
    const inst = mkRelicInstance(`rb${nextIdx}`, item.relicId)
    let s: GameState = {
      ...state,
      player: { ...state.player, gold, relics: [...state.player.relics, inst] },
      shop: { items },
    }
    s = applyRelicTriggers(s, item.relicId, 'onPickup')
    return { state: s, events: [] }
  }

  if (item.kind === 'KEY') {
    return {
      state: {
        ...state,
        player: { ...state.player, gold, keys: state.player.keys + 1 },
        shop: { items },
      },
      events: [],
    }
  }

  const serial = state.player.nextCardInstanceSerial
  const newId = `c${serial}` as CardInstanceId
  const inst = mkCardInstance(newId, item.cardId, item.upgrades)
  const cardById2 = { ...state.player.deck.cardById, [inst.id]: inst }
  const drawPile2 = [...state.player.deck.drawPile, inst.id]

  let s: GameState = {
    ...state,
    player: {
      ...state.player,
      gold,
      nextCardInstanceSerial: serial + 1,
      deck: { ...state.player.deck, cardById: cardById2, drawPile: drawPile2 },
    },
    shop: { items },
  }
  s = applyCardPickupEffects(s, item.cardId)
  return { state: s, events: [] }
}

function startStarterRelicSelection(state: GameState): GameState {
  // Populate starter deck (MVP): 7x BUNNYMANCY, 1x MULTIBUNNIES.
  const starter = buildStarterDeck()

  // New Game should be random each run: reseed RNG here.
  const freshSeed = ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0) || 1
  let rng = rngFromSeed(freshSeed)
  const owned = new Set(state.player.relics.map((r) => r.templateId))
  const pool = StarterRelicPool.filter((id) => isRelicOfferable(id, owned))
  const offered: RelicId[] = []

  const picks = Math.min(3, pool.length)
  for (let i = 0; i < picks; i++) {
    const [r2, idx] = rngInt(rng, 0, pool.length)
    rng = r2
    const [picked] = pool.splice(idx, 1)
    if (picked) offered.push(picked)
  }

  // Shuffle offered choices for presentation.
  for (let i = offered.length - 1; i > 0; i--) {
    const [r2, j] = rngInt(rng, 0, i + 1)
    rng = r2
    const tmp = offered[i]!
    offered[i] = offered[j]!
    offered[j] = tmp
  }

  const s2: GameState = {
    ...state,
    seed: freshSeed,
    rng,
    restOutcome: null,
    shop: null,
    pathCooldownUntil: {},
    mysteryRoomCooldownUntil: {},
    player: {
      ...state.player,
      nextCardInstanceSerial: 1,
      shield: 0,
      lockedShield: 0,
      // New game baseline (ink is represented by energy in MVP).
      energy: 3,
      maxEnergy: 3,
      deck: {
        cardById: starter.cardById,
        drawPile: starter.drawPile,
        hand: [],
        discardPile: [],
      },
    },
    relicSelection: { category: 'STARTER_RELICS', offered },
    treasureRoom: null,
    gemstoneCavern: null,
    mysteryRoom: null,
  }
  return setPhase(s2, 'RELIC_SELECT_STARTER')
}

function chooseStarterRelic(state: GameState, relicId: RelicId): GameState {
  const offered = state.relicSelection?.offered ?? []
  if (!offered.includes(relicId)) return state

  const nextIdx = state.player.relics.length + 1
  const inst = mkRelicInstance(`rb${nextIdx}`, relicId)

  // Apply on-pickup triggers immediately.
  let sPickup: GameState = { ...state, player: { ...state.player, relics: [...state.player.relics, inst] } }
  sPickup = applyRelicTriggers(sPickup, relicId, 'onPickup')

  // After picking a starter relic, advance to path selection.
  let rng = sPickup.rng
  const rolled = rollPaths(rng, sPickup.level, 3, sPickup.pathCooldownUntil, sPickup.player.deck)
  const pathPick = buildPathSelection(rolled.rng, rolled.offered, sPickup.level)

  const s2: GameState = {
    ...sPickup,
    rng: pathPick.rng,
    relicSelection: null,
    treasureRoom: null,
    gemstoneCavern: null,
    mysteryRoom: null,
    pathSelection: pathPick.pathSelection,
    activeRoomPathId: null,
  }

  return setPhase(s2, 'PATH_SELECT')
}

function rollPaths(
  rngIn: GameState['rng'],
  level: number,
  count: number,
  pathCooldownUntil: Readonly<Partial<Record<PathId, number>>>,
  deck: GameState['player']['deck'],
): { rng: GameState['rng']; offered: PathId[] } {
  if (level === 15 || level === 32) return { rng: rngIn, offered: ['BOSS'] }

  const gemstoneCavernOfferable = deckHasSocketableCard(deck.cardById)
  let rng = rngIn
  let available: PathId[] = PathPool.filter((id) => {
    const path = Paths[id]
    if (!path || path.minimumLevel > level) return false
    const until = pathCooldownUntil[id]
    if (until !== undefined && level < until) return false
    if (path.requiresSocketableCard && !gemstoneCavernOfferable) return false
    return true
  })
  const offered: PathId[] = []

  for (let i = 0; i < count; i++) {
    if (!available.length) break
    const total = available.reduce((acc, id) => acc + Math.max(0, Paths[id]?.frequency ?? 0), 0)
    if (total <= 0) break

    const [r2, n] = rngInt(rng, 0, total)
    rng = r2

    let cursor = 0
    let picked: PathId = available[0]!
    for (const id of available) {
      cursor += Math.max(0, Paths[id]?.frequency ?? 0)
      if (n < cursor) {
        picked = id
        break
      }
    }

    offered.push(picked)
    if (!Paths[picked]?.duplicatesAllowed) {
      available = available.filter((id) => id !== picked)
    }
  }

  return { rng, offered }
}

function advanceToNextPathSelectionAfterNode(
  state: GameState,
  fromPhase: 'REST' | 'SHOP' | 'TREASURE_ROOM' | 'GEMSTONE_CAVERN' | 'EVENT',
): { state: GameState; events: GameEvent[] } {
  if (state.phase !== fromPhase) return { state, events: [] }

  const nextLevel = state.level + 1
  let rng = state.rng
  const rolled = rollPaths(rng, nextLevel, 3, state.pathCooldownUntil, state.player.deck)
  const pathPick = buildPathSelection(rolled.rng, rolled.offered, nextLevel)

  const s2: GameState = {
    ...state,
    level: nextLevel,
    rng: pathPick.rng,
    restOutcome: null,
    defeat: null,
    shop: null,
    treasureRoom: null,
    gemstoneCavern: null,
    mysteryRoom: null,
    pathSelection: pathPick.pathSelection,
    activeRoomPathId: null,
  }

  return { state: setPhase(s2, 'PATH_SELECT'), events: [] }
}

function continueAfterRest(state: GameState): { state: GameState; events: GameEvent[] } {
  const rest = state.restOutcome
  if (state.phase !== 'REST' || !rest || !restChoiceMade(rest)) return { state, events: [] }
  return advanceToNextPathSelectionAfterNode(state, 'REST')
}

function restSleep(state: GameState): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'REST') return { state, events: [] }
  const rest = state.restOutcome
  if (!rest || restChoiceMade(rest)) return { state, events: [] }

  const healAmount = rest.sleepHealAmount
  const p = state.player
  let s: GameState = {
    ...state,
    player: { ...p, hp: p.hp + healAmount },
    restOutcome: { ...rest, slept: true, healedHp: healAmount },
  }

  for (const rInst of s.player.relics) {
    s = applyRelicTriggers(s, rInst.templateId, 'onSleep')
  }

  return { state: s, events: [] }
}

function restStudy(state: GameState): { state: GameState; events: GameEvent[] } {
  if (state.phase !== 'REST') return { state, events: [] }
  const rest = state.restOutcome
  if (!rest || restChoiceMade(rest)) return { state, events: [] }

  const { state: upgraded, upgradedCardInstanceId } = applyRandomStudyUpgrade(state)
  return {
    state: {
      ...upgraded,
      restOutcome: {
        ...rest,
        studied: true,
        ...(upgradedCardInstanceId != null ? { studiedCardInstanceId: upgradedCardInstanceId } : {}),
      },
    },
    events: [],
  }
}

function continueAfterShop(state: GameState): { state: GameState; events: GameEvent[] } {
  return advanceToNextPathSelectionAfterNode(state, 'SHOP')
}

function continueAfterTreasureRoom(state: GameState): { state: GameState; events: GameEvent[] } {
  if (!state.treasureRoom?.selectionComplete) return { state, events: [] }
  return advanceToNextPathSelectionAfterNode(state, 'TREASURE_ROOM')
}

function continueAfterGemstoneCavern(state: GameState): { state: GameState; events: GameEvent[] } {
  return advanceToNextPathSelectionAfterNode(state, 'GEMSTONE_CAVERN')
}

function continueAfterMysteryRoom(state: GameState): { state: GameState; events: GameEvent[] } {
  const roomId = state.mysteryRoom?.roomId
  if (!roomId || !mysteryRoomIsEvent(roomId)) return { state, events: [] }
  if (roomId === 'FONT_OF_LETHE' && !fontOfLetheCanProceed(state)) return { state, events: [] }
  if (roomId === 'COLLECTOR' && !collectorCanProceed(state)) return { state, events: [] }
  if (roomId === 'PRINTER' && !printerCanProceed(state)) return { state, events: [] }
  return advanceToNextPathSelectionAfterNode(state, 'EVENT')
}

function pickTreasureRoomRelic(state: GameState, relicId: RelicId): GameState {
  if (state.phase !== 'TREASURE_ROOM') return state
  const tr = state.treasureRoom
  if (!tr || tr.selectionComplete) return state
  if (!tr.offered.includes(relicId)) return state

  const nextIdx = state.player.relics.length + 1
  const inst = mkRelicInstance(`rb${nextIdx}`, relicId)
  let s: GameState = {
    ...state,
    player: { ...state.player, relics: [...state.player.relics, inst] },
    treasureRoom: { offered: [], selectionComplete: true },
  }
  s = applyRelicTriggers(s, relicId, 'onPickup')
  return s
}

function buildPathSelection(rng: GameState['rng'], offered: PathId[], level: number): { rng: GameState['rng']; pathSelection: PathSelectionState } {
  const lockOut = determineLocks(rng, offered, level)
  const slotLocked = lockOut.slotLocked.map((locked, i) => locked || (Paths[offered[i]!]?.alwaysLocked ?? false))
  let rngOut = lockOut.rng
  const combatPreviews: Array<PathCombatPreview | null> = []
  for (let i = 0; i < offered.length; i++) {
    const pathId = offered[i]!
    if (!isCombatPath(pathId)) {
      combatPreviews.push(null)
      continue
    }
    const rolled = rollPathCombatEncounter(rngOut, level, pathId)
    rngOut = rolled.rng
    combatPreviews.push(rolled.preview)
  }
  return {
    rng: rngOut,
    pathSelection: { offered, slotLocked, combatPreviews },
  }
}

function unlockPathSlot(state: GameState, slotIndex: number): GameState {
  if (state.phase !== 'PATH_SELECT') return state
  const ps = state.pathSelection
  if (!ps || slotIndex < 0 || slotIndex >= ps.offered.length) return state
  if (!ps.slotLocked[slotIndex]) return state
  if (state.player.keys <= 0) return state

  const slotLocked = ps.slotLocked.map((v, i) => (i === slotIndex ? false : v))
  return {
    ...state,
    player: { ...state.player, keys: state.player.keys - 1 },
    pathSelection: { ...ps, slotLocked },
  }
}

function withPathCooldownApplied(state: GameState, pathId: PathId): GameState {
  const cd = Paths[pathId]?.cooldown ?? 0
  if (cd <= 0) return state
  return {
    ...state,
    pathCooldownUntil: { ...state.pathCooldownUntil, [pathId]: state.level + cd },
  }
}

function withMysteryRoomCooldownApplied(state: GameState, roomId: MysteryRoomId): GameState {
  const cd = MysteryRooms[roomId]?.cooldown ?? 0
  if (cd <= 0) return state
  return {
    ...state,
    mysteryRoomCooldownUntil: { ...state.mysteryRoomCooldownUntil, [roomId]: state.level + cd },
  }
}

function applyNonCombatMapRoute(
  baseState: GameState,
  routePathId: PathId,
): { state: GameState; events: GameEvent[] } {
  const mapRoute = Paths[routePathId]?.mapRoute ?? 'combat'
  switch (mapRoute) {
    case 'shop': {
      const ownedRelics = new Set(baseState.player.relics.map((r) => r.templateId))
      const stockOut = populateShop(baseState.rng, ownedRelics, baseState.level, baseState.player.luck)
      const priced = assignShopPrices(stockOut.rng, stockOut.stock, {
        stock: stockOut.stock,
        ownedRelicTemplateIds: ownedRelics,
        playerGold: baseState.player.gold,
        level: baseState.level,
      })
      return {
        state: setPhase(
          {
            ...baseState,
            rng: priced.rng,
            restOutcome: null,
            cardReward: null,
            treasureRoom: null,
            mysteryRoom: null,
            shop: { items: priced.items },
          },
          'SHOP',
        ),
        events: [],
      }
    }
    case 'rest': {
      const p = baseState.player
      const sleepHealAmount = computeSleepHealAmount(p.maxHp, p.hp)
      return {
        state: setPhase(
          {
            ...baseState,
            restOutcome: { sleepHealAmount, slept: false, studied: false },
            cardReward: null,
            treasureRoom: null,
            shop: null,
            mysteryRoom: null,
          },
          'REST',
        ),
        events: [],
      }
    }
    case 'treasure_room': {
      const ownedRelics = new Set(baseState.player.relics.map((r) => r.templateId))
      const relicPick = pickThreeShopRelics(baseState.rng, ownedRelics)
      return {
        state: setPhase(
          {
            ...baseState,
            rng: relicPick.rng,
            restOutcome: null,
            cardReward: null,
            shop: null,
            mysteryRoom: null,
            treasureRoom: { offered: relicPick.relicIds, selectionComplete: false },
          },
          'TREASURE_ROOM',
        ),
        events: [],
      }
    }
    case 'card_reward': {
      const rewardOut = populateCardReward({
        rng: baseState.rng,
        baseRewardLevel: baseState.level,
        luck: baseState.player.luck,
        count: 3,
      })
      return {
        state: setPhase(
          {
            ...baseState,
            rng: rewardOut.rng,
            restOutcome: null,
            treasureRoom: null,
            mysteryRoom: null,
            cardReward: {
              kind: 'CARD',
              offered: rewardOut.offered,
              goldEarned: 0,
              keysEarned: 0,
              goldPickedUp: true,
              keysPickedUp: true,
            },
          },
          'REWARD',
        ),
        events: [],
      }
    }
    case 'gemstone_cavern': {
      const gemRoll = rollGemOffers(baseState.rng, 3)
      return {
        state: setPhase(
          {
            ...baseState,
            rng: gemRoll.rng,
            restOutcome: null,
            cardReward: null,
            treasureRoom: null,
            shop: null,
            mysteryRoom: null,
            gemstoneCavern: { offered: gemRoll.offered, socketing: null },
          },
          'GEMSTONE_CAVERN',
        ),
        events: [],
      }
    }
    default:
      return { state: baseState, events: [] }
  }
}

function choosePath(
  state: GameState,
  pathId: PathId,
  slotIndex: number,
): { state: GameState; events: GameEvent[] } {
  const ps = state.pathSelection
  const offered = ps?.offered ?? []
  const slotLocked = ps?.slotLocked ?? []
  const combatPreview = ps?.combatPreviews?.[slotIndex] ?? null
  if (!offered[slotIndex] || offered[slotIndex] !== pathId) return { state, events: [] }
  if (slotLocked[slotIndex]) return { state, events: [] }

  const baseState: GameState = withPathCooldownApplied(
    { ...state, pathSelection: null, activeRoomPathId: pathId },
    pathId,
  )
  const mapRoute = Paths[pathId]?.mapRoute ?? 'combat'

  if (mapRoute === 'mystery') {
    const roomRoll = rollMysteryRoom(
      baseState.rng,
      baseState.level,
      baseState.player.deck.cardById,
      baseState.mysteryRoomCooldownUntil,
    )
    const cooledState = withMysteryRoomCooldownApplied({ ...baseState, rng: roomRoll.rng }, roomRoll.roomId)
    const revealedPathId = mysteryRoomPathId(roomRoll.roomId)
    if (revealedPathId) {
      const revealedState: GameState = {
        ...cooledState,
        activeRoomPathId: revealedPathId,
        mysteryRoom: null,
      }
      if (isCombatPath(revealedPathId)) {
        const encounter = rollPathCombatEncounter(revealedState.rng, revealedState.level, revealedPathId)
        const sCombat = { ...revealedState, rng: encounter.rng }
        const out = startCombat(
          sCombat,
          encounter.preview.enemyTemplateId,
          revealedPathId,
          encounter.preview.boons,
          encounter.preview.maxHp,
        )
        return { state: out.state, events: out.events }
      }
      return applyNonCombatMapRoute(revealedState, revealedPathId)
    }
    const eventPrep = cooledState
    const collectorInit =
      roomRoll.roomId === 'COLLECTOR' ? initCollectorMysteryRoom(eventPrep.rng, eventPrep) : null
    return {
      state: setPhase(
        {
          ...cooledState,
          rng: collectorInit?.rng ?? roomRoll.rng,
          restOutcome: null,
          cardReward: null,
          treasureRoom: null,
          shop: null,
          gemstoneCavern: null,
          mysteryRoom: collectorInit?.mysteryRoom ?? mkMysteryRoomState(roomRoll.roomId),
        },
        'EVENT',
      ),
      events: [],
    }
  }

  if (mapRoute !== 'combat') {
    return applyNonCombatMapRoute(baseState, pathId)
  }

  let preview: PathCombatPreview | null = combatPreview
  let sCombat = baseState
  if (!preview) {
    const encounter = rollPathCombatEncounter(sCombat.rng, sCombat.level, pathId)
    sCombat = { ...sCombat, rng: encounter.rng }
    preview = encounter.preview
  }
  const out = startCombat(sCombat, preview.enemyTemplateId, pathId, preview.boons, preview.maxHp)
  return { state: out.state, events: out.events }
}

