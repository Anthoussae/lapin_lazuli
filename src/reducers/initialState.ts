import { rngFromSeed } from '../core/rng/rng'
import type { CardInstance, GameState } from '../core/types/state'
import type { CardInstanceId } from '../core/types/ids'
import { animInitial } from '../animation/types'
import { inputInitial } from '../input/types'

export function initialState(seed = 12345): GameState {
  // Deck is populated on TITLE/NEW_GAME (so "New Game" is the single source of truth).
  const cardById: Record<CardInstanceId, CardInstance> = {}
  const drawPile: CardInstanceId[] = []

  const s: GameState = {
    v: 1,
    seed,
    rng: rngFromSeed(seed),
    level: 0,
    phase: 'BOOT',
    phasePrev: null,
    assets: { status: 'UNLOADED', loaded: [], failed: [] },
    currentCombatPathId: null,
    player: {
      hp: 100,
      maxHp: 100,
      shield: 0,
      lockedShield: 0,
      keys: 0,
      energy: 3,
      maxEnergy: 3,
      gold: 0,
      bunnies: 0,
      power: 0,
      firepowerMultiplier: 0,
      luck: 0,
      upgradeChance: 0,
      baseHandSize: 5,
      handSize: 5,
      nextCardInstanceSerial: 1,
      deck: { cardById, drawPile, hand: [], discardPile: [] },
      relics: [],
    },
    combat: null,
    relicSelection: null,
    treasureRoom: null,
    gemstoneCavern: null,
    pathSelection: null,
    cardReward: null,
    shop: null,
    restOutcome: null,
    pathCooldownUntil: {},
    defeat: null,
    ui: {
      anim: animInitial(),
      input: inputInitial(),
      debug: { lastEvents: [] },
    },
  }

  // Note: combat is created by a phase action, not at boot.
  return s
}

