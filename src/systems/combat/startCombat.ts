import type { CombatState, GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { setPhase } from '../../reducers/reduceGame'
import { rollEnemyIntent } from './intents'
import { combatEffectiveMaxEnergy, combatRefreshDrawCount, drawCards, shuffleDrawPile } from './zones'
import { Relics } from '../../data/relics'
import { applyRelicEffect } from '../relics/applyRelicEffects'
import { applyTurnStartRelicTriggers } from '../relics/triggers'
import { spawnEnemy } from './spawnEnemy'
import type { EnemyId, PathId } from '../../core/types/ids'
import type { EnemyBoonId } from '../../data/enemyBoons'
import {
  combatAlchemistLeadIngotCount,
  combatHandDrawDeltaFromEnemies,
  combatMaxEnergyDeltaFromEnemies,
} from '../../data/enemyBoons'
import { shuffleBurdenIntoDeck } from '../cards/shuffleBurdenIntoDeck'
import { applyDrainingAtPlayerTurnStart } from './drainingBoon'
import { clearActiveCombat } from './endCombat'
import { putDestinyCardsInOpeningHand } from './destiny'

export function startCombat(
  state: GameState,
  enemyTemplateId: EnemyId = 'CARROT_GOBLIN',
  combatEntryPathId: PathId | null = null,
  enemyBoons: ReadonlyArray<EnemyBoonId> = [],
  /** When set (e.g. from path picker), HP matches the preview roll and no HP dice are consumed. */
  fixedEnemyHp?: number,
): { state: GameState; events: GameEvent[] } {
  const spawned = spawnEnemy(clearActiveCombat(state), 'e1', enemyTemplateId, enemyBoons, {
    fixedMaxHp: fixedEnemyHp,
  })
  const e1 = spawned.enemy
  const enemyById = { [e1.id]: e1 }
  const handDrawDelta = combatHandDrawDeltaFromEnemies(Object.values(enemyById))
  const maxEnergyDelta = combatMaxEnergyDeltaFromEnemies(Object.values(enemyById))
  const combatInit: CombatState = {
    id: 'combat1',
    turn: 1,
    combatEntryPathId,
    handDrawDelta,
    maxEnergyDelta,
    playerTurnStartBunnyDrain: 0,
    enemies: { enemyById, aliveIds: [e1.id] },
    targeting: { selectedEnemyId: e1.id },
    handSelection: null,
  }

  let s: GameState = {
    ...spawned.state,
    currentCombatPathId: combatEntryPathId,
    combat: combatInit,
    player: {
      ...state.player,
      shield: 0,
      energy: combatEffectiveMaxEnergy({
        ...spawned.state,
        currentCombatPathId: combatEntryPathId,
        combat: combatInit,
        player: state.player,
      }),
      deck: {
        ...state.player.deck,
        hand: [],
        discardPile: [],
        drawPile: state.player.deck.drawPile,
      },
    },
  }

  s = setPhase(s, 'COMBAT_PLAYER_READY')
  // Deterministic: intent roll consumes RNG from state.
  s = rollEnemyIntent(s)

  // Shuffle draw pile on combat start.
  s = shuffleDrawPile(s)

  // Alchemist: shuffle Lead ingot(s) into the deck before opening hand (and before combat_start relics).
  const leadCount = combatAlchemistLeadIngotCount(Object.values(enemyById))
  for (let i = 0; i < leadCount; i++) {
    s = shuffleBurdenIntoDeck(s, 'LEAD_INGOT')
  }

  // Relic triggers at combat start (bunnies etc).
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'combat_start') continue
      s = applyRelicEffect(s, trig.effect)
    }
  }

  const inkCap = combatEffectiveMaxEnergy(s)
  s = { ...s, player: { ...s.player, energy: Math.min(s.player.energy, inkCap) } }

  // Draining: first player turn start (same timing as subsequent turns in beginPlayerTurn).
  s = applyDrainingAtPlayerTurnStart(s)
  s = applyTurnStartRelicTriggers(s)

  // Starting hand draw bonuses.
  let bonusDraw = 0
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'draw_starting_hand') continue
      if (trig.effect.kind !== 'DRAW_CARDS') continue
      bonusDraw += trig.effect.amount
    }
  }

  s = putDestinyCardsInOpeningHand(s)
  s = drawCards(s, combatRefreshDrawCount(s, bonusDraw))
  return { state: s, events: [] }
}

