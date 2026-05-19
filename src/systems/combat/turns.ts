import type { CardInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { setPhase } from '../../reducers/reduceGame'
import {
  combatEffectiveMaxEnergy,
  combatRefreshDrawCount,
  drawCards,
  shuffleDiscardIntoDrawIfNeeded,
} from './zones'
import { rollEnemyIntent } from './intents'
import { resolveEnemyIntent } from './intentResolution'
import { Relics } from '../../data/relics'
import { applyRelicEffect } from '../relics/applyRelicEffects'
import { applyTurnStartRelicTriggers } from '../relics/triggers'
import { Enemies } from '../../data/enemies'
import { applyDrainingAtPlayerTurnStart } from './drainingBoon'
import { damageEnemy } from './damageEnemy'
import { cardInstanceConsumesIfInHandAtTurnEnd, cardInstanceRetains } from '../cards/cardEffects'
import { consumeCardFromDeck } from './zones'

export function endPlayerTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }
  let s: GameState = setPhase(state, 'COMBAT_RESOLVING')
  let events: GameEvent[] = [{ type: 'EVT/TURN_ENDED', by: 'PLAYER' }]

  // End-of-turn triggers.
  for (const rInst of s.player.relics) {
    const rTmpl = Relics[rInst.templateId]
    for (const trig of rTmpl.triggers) {
      if (trig.on !== 'turn_end') continue
      s = applyRelicEffect(s, trig.effect)
      events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
    }
  }

  // Unleash the bunnies: damage = max(0, bunnies); negative bunnies release for 0 damage. Always clear bunnies after.
  const bunnyDmg = Math.max(0, s.player.bunnies)
  if (bunnyDmg > 0) {
    const combat0 = s.combat
    if (combat0) {
      const selected = combat0.targeting.selectedEnemyId
      const enemyId =
        (selected && combat0.enemies.enemyById[selected] ? selected : null) ?? (combat0.enemies.aliveIds[0] ?? null)
      if (enemyId) {
        const out = damageEnemy(s, enemyId, bunnyDmg)
        s = out.state
        events.push(...out.events)
      }
    }
  }
  s = { ...s, player: { ...s.player, bunnies: 0 } }

  for (const cardInstanceId of [...s.player.deck.hand]) {
    const inst = s.player.deck.cardById[cardInstanceId]
    if (!inst || !cardInstanceConsumesIfInHandAtTurnEnd(inst)) continue
    s = consumeCardFromDeck(s, cardInstanceId)
  }

  // Discard hand (retained cards stay in hand).
  const retainedHand: CardInstanceId[] = []
  const discardedFromHand: CardInstanceId[] = []
  for (const cardInstanceId of s.player.deck.hand) {
    const inst = s.player.deck.cardById[cardInstanceId]
    if (inst && cardInstanceRetains(inst)) retainedHand.push(cardInstanceId)
    else discardedFromHand.push(cardInstanceId)
  }
  const disc = [...s.player.deck.discardPile, ...discardedFromHand]
  s = {
    ...s,
    player: { ...s.player, deck: { ...s.player.deck, hand: retainedHand, discardPile: disc } },
  }

  // Enemy turn.
  const out = enemyTakeTurn(s)
  s = out.state
  events = events.concat(out.events)
  events.push({ type: 'EVT/TURN_ENDED', by: 'ENEMIES' })

  if (s.player.hp > 0 && s.combat?.enemies.aliveIds.length) {
    s = beginPlayerTurn(s)
    s = setPhase(s, 'COMBAT_PLAYER_READY')
  }
  return { state: s, events }
}

function enemyTakeTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }
  let s = state
  const events: GameEvent[] = []
  const aliveIds = [...state.combat.enemies.aliveIds]

  for (const enemyId of aliveIds) {
    const combat0 = s.combat
    if (!combat0) break
    const enemy = combat0.enemies.enemyById[enemyId]
    if (!enemy || enemy.hp <= 0) continue

    const combatAfter = s.combat
    if (!combatAfter) break
    const enemyNow = combatAfter.enemies.enemyById[enemyId]
    if (!enemyNow || enemyNow.hp <= 0) continue

    const intent = enemyNow.intent
    if (!intent || intent.kind === 'WAIT') continue

    if (intent.kind === 'ATTACK') {
      for (const rInst of s.player.relics) {
        const rTmpl = Relics[rInst.templateId]
        for (const trig of rTmpl.triggers) {
          if (trig.on !== 'enemy_attack') continue
          s = applyRelicEffect(s, trig.effect)
          events.push({ type: 'EVT/RELIC_TRIGGERED', relicId: rInst.templateId, trigger: trig.id })
        }
      }
    }

    const resolved = resolveEnemyIntent(s, enemyId, intent)
    s = resolved.state
    if (intent.kind === 'ATTACK') {
      const str = Math.max(0, enemyNow.strength)
      events.push({ type: 'EVT/PLAYER_HIT', amount: intent.damage + str })
    }
    if (resolved.playerDied) {
      const name = Enemies[enemyNow.templateId]?.name ?? enemyNow.templateId
      const lvl = Enemies[enemyNow.templateId]?.level ?? s.level
      s = setPhase({ ...s, defeat: { enemyName: name, level: lvl } }, 'DEFEAT')
      events.push({ type: 'EVT/UNIT_DIED', unit: 'PLAYER' })
      break
    }
  }

  return { state: s, events }
}

function beginPlayerTurn(state: GameState): GameState {
  const combat0 = state.combat
  if (!combat0 || combat0.enemies.aliveIds.length === 0) return state

  // Turn 1 drain is applied in startCombat; later turns drain here.
  let sDrain = combat0.turn > 1 ? applyDrainingAtPlayerTurnStart(state) : state
  sDrain = applyTurnStartRelicTriggers(sDrain)

  // Refill energy and advance combat turn (first round is turn 1 at combat start; increments after each enemy phase).
  const nextCombat = { ...combat0, turn: combat0.turn + 1 }
  let s: GameState = {
    ...sDrain,
    combat: nextCombat,
    player: {
      ...sDrain.player,
      shield: 0,
      energy: combatEffectiveMaxEnergy({ ...sDrain, combat: nextCombat }),
    },
  }
  // Roll intents for next enemy turn.
  s = rollEnemyIntent(s)
  // Draw starting hand for the turn (base hand size + combat modifiers).
  s = shuffleDiscardIntoDrawIfNeeded(s)
  s = drawCards(s, combatRefreshDrawCount(s, 0))
  return s
}

