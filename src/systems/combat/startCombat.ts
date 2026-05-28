import type { CombatState, GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { setPhase } from '../../reducers/reduceGame'
import { rollEnemyIntent } from './intents'
import { combatEffectiveMaxEnergy, combatRefreshDrawCount, drawCards, shuffleDrawPile } from './zones'
import { Relics } from '../../data/relics'
import { applyRelicEffect } from '../relics/applyRelicEffects'
import { applyTurnStartRelicTriggers } from '../relics/triggers'
import { spawnEnemy } from './spawnEnemy'
import type { EnemyId, EnemyInstanceId, PathId } from '../../core/types/ids'
import type { EnemyBoonId } from '../../data/enemyBoons'
import {
  combatAlchemistLeadIngotCount,
  combatHandDrawDeltaFromEnemies,
  combatMaxEnergyDeltaFromEnemies,
} from '../../data/enemyBoons'
import { enqueueBurdenAdds } from './burdenAdd'
import { applyDrainingAtPlayerTurnStart } from './drainingBoon'
import { clearActiveCombat } from './endCombat'
import { putDestinyCardsInOpeningHand } from './destiny'
import { EMPTY_COMBAT_BONUSES } from './combatBonuses'
import type { EnchantmentInstanceId } from '../../core/types/ids'
import type { EnchantmentTargetRef } from '../../core/types/enchantments'
import { Enemies } from '../../data/enemies'
import { Enchantments } from '../../data/enchantments'
import { applyStaticEnchantmentOnGain } from '../enchantments/staticEffects'

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
    bunnyReleasePending: false,
    pendingTurnStartDraw: false,
    bunnyReleaseSpriteCount: 0,
    bunnyReleaseTargetEnemyId: null,
    monsterDefeatPending: null,
    playerDefeatPending: false,
    freeFirstFireSpell: false,
    nextSpellCosts0: false,
    cardsPlayedThisTurn: 0,
    paintbrushTriggeredThisTurn: false,
    combatBonuses: EMPTY_COMBAT_BONUSES,
    playerTookUnblockedDamage: false,
    burdenAddQueue: [],
    nextBurdenAddSerial: 1,
    pendingOpeningHandDraw: null,
    phasedOut: [],
    enchantments: [],
    nextEnchantmentInstanceSerial: 1,
  }

  const player0 = spawned.state.player
  let s: GameState = {
    ...spawned.state,
    currentCombatPathId: combatEntryPathId,
    combat: combatInit,
    player: {
      ...player0,
      bunnies: 0,
      shield: 0,
      energy: combatEffectiveMaxEnergy({
        ...spawned.state,
        currentCombatPathId: combatEntryPathId,
        combat: combatInit,
        player: player0,
      }),
      deck: {
        ...player0.deck,
        hand: [],
        discardPile: [],
        drawPile: player0.deck.drawPile,
      },
    },
  }

  s = applyForcedEnemyTemplateEnchantment(s, e1.id, enemyTemplateId)
  s = setPhase(s, 'COMBAT_PLAYER_READY')
  // Deterministic: intent roll consumes RNG from state.
  s = rollEnemyIntent(s)

  // Shuffle draw pile on combat start.
  s = shuffleDrawPile(s)

  // Alchemist: lead ingot(s) are queued for add-to-deck FX before the opening hand draw.
  const leadCount = combatAlchemistLeadIngotCount(Object.values(enemyById))
  if (leadCount > 0) {
    s = enqueueBurdenAdds(s, 'LEAD_INGOT', leadCount, 'draw', e1.id)
  }

  // Relic triggers at combat start (bunnies etc).
  const events: GameEvent[] = []
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'combat_start') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }

  const inkCap = combatEffectiveMaxEnergy(s)
  s = { ...s, player: { ...s.player, energy: Math.min(s.player.energy, inkCap) } }

  // Draining: first player turn start (same timing as subsequent turns in beginPlayerTurn).
  const draining = applyDrainingAtPlayerTurnStart(s)
  s = draining.state
  events.push(...draining.events)
  const turnStart = applyTurnStartRelicTriggers(s)
  s = turnStart.state
  events.push(...turnStart.events)

  // Starting hand draw bonuses.
  let bonusDraw = 0
  for (const rInst of s.player.relics) {
    const tmpl = Relics[rInst.templateId]
    for (const trig of tmpl.triggers) {
      if (trig.on !== 'draw_starting_hand') continue
      if (trig.effect.kind !== 'DRAW_CARDS') continue
      bonusDraw += trig.effect.amount
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }

  s = putDestinyCardsInOpeningHand(s)

  const combatAfter = s.combat
  if (combatAfter && combatAfter.burdenAddQueue.length > 0) {
    s = {
      ...s,
      combat: {
        ...combatAfter,
        pendingOpeningHandDraw: { bonusDraw },
      },
    }
    return { state: s, events }
  }

  const openingDraw = drawCards(s, combatRefreshDrawCount(s, bonusDraw), { openingHand: true })
  return { state: openingDraw.state, events }
}

function applyForcedEnemyTemplateEnchantment(
  state: GameState,
  enemyInstanceId: EnemyInstanceId,
  templateId: EnemyId,
): GameState {
  const combat0 = state.combat
  if (!combat0) return state
  const tmpl = Enemies[templateId]
  const enchId = tmpl.forceEnchantment
  if (!enchId) return state
  const enchTmpl = Enchantments[enchId]
  if (!enchTmpl) return state

  const target: EnchantmentTargetRef = { kind: 'ENEMY', enemyInstanceId }
  const stackable = enchTmpl.stackable ?? false
  if (!stackable) {
    const already = combat0.enchantments.some((e) => e.templateId === enchId && e.target.kind === 'ENEMY' && e.target.enemyInstanceId === enemyInstanceId)
    if (already) return state
  }

  const instId = (`ench${combat0.nextEnchantmentInstanceSerial}` as unknown) as EnchantmentInstanceId
  const nextInst = {
    id: instId,
    templateId: enchId,
    owner: { kind: 'ENEMY', enemyInstanceId } as const,
    target,
  }
  const sNext: GameState = {
    ...state,
    combat: {
      ...combat0,
      enchantments: [...combat0.enchantments, nextInst],
      nextEnchantmentInstanceSerial: combat0.nextEnchantmentInstanceSerial + 1,
    },
  }
  return applyStaticEnchantmentOnGain(sNext, nextInst)
}

