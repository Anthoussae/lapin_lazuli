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
import { cardInstanceExpiresAtTurnEnd, cardInstanceRetains } from '../cards/cardEffects'
import { consumeCardFromDeck } from './zones'
import { bunnyReleaseSpriteCount } from '../bunnies'
import { bunnyReleaseTargetEnemyId } from './bunnyReleaseTarget'
import { livingEnemyCount } from './livingEnemies'
import { applyEnchantmentTurnStartForEnemy, applyEnchantmentTurnStartForPlayer } from '../enchantments/turnStart'

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

  if (s.player.bunnies !== 0) {
    const combat0 = s.combat
    if (!combat0) return { state: s, events }
    const sprites = bunnyReleaseSpriteCount(s.player.bunnies)
    return {
      state: {
        ...s,
        combat: {
          ...combat0,
          bunnyReleasePending: true,
          bunnyReleaseSpriteCount: sprites,
          bunnyReleaseTargetEnemyId: bunnyReleaseTargetEnemyId(combat0),
        },
      },
      events: [...events, { type: 'EVT/BUNNIES_RELEASING', count: s.player.bunnies }],
    }
  }

  return finishPlayerTurnAfterBunnies(s, events)
}

export function completeBunnyRelease(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat?.bunnyReleasePending) return { state, events: [] }
  const s: GameState = {
    ...state,
    combat: {
      ...combat,
      bunnyReleasePending: false,
      bunnyReleaseSpriteCount: 0,
      bunnyReleaseTargetEnemyId: null,
    },
  }
  return finishPlayerTurnAfterBunnies(s, [])
}

function finishPlayerTurnAfterBunnies(
  state: GameState,
  eventsIn: GameEvent[],
): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: eventsIn }
  let s = state
  let events = [...eventsIn]

  // Unleash the bunnies: damage = max(0, bunnies); negative bunnies release for 0 damage. Always clear bunnies after.
  const bunnyDmg = Math.max(0, s.player.bunnies)
  if (bunnyDmg > 0) {
    const combat0 = s.combat
    if (combat0) {
      const enemyId = combat0.bunnyReleaseTargetEnemyId ?? bunnyReleaseTargetEnemyId(combat0)
      if (enemyId) {
        const out = damageEnemy(s, enemyId, bunnyDmg, { attacker: { kind: 'PLAYER' } })
        s = out.state
        events.push(...out.events)
      }
    }
  }
  s = { ...s, player: { ...s.player, bunnies: 0 } }

  for (const cardInstanceId of [...s.player.deck.hand]) {
    const inst = s.player.deck.cardById[cardInstanceId]
    if (!inst || !cardInstanceExpiresAtTurnEnd(inst)) continue
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

  if (s.combat && s.player.hp > 0 && livingEnemyCount(s.combat) > 0) {
    const combat0 = s.combat
    if (combat0) {
      s = {
        ...s,
        combat: { ...combat0, pendingTurnStartDraw: true },
      }
    }
  }
  return { state: s, events }
}

/** Draw the new player hand after end-of-turn discards (and UI discard animations) have finished. */
export function completeTurnStartDraw(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat?.pendingTurnStartDraw) return { state, events: [] }
  if (state.player.hp <= 0 || livingEnemyCount(combat) === 0) {
    return {
      state: { ...state, combat: { ...combat, pendingTurnStartDraw: false } },
      events: [],
    }
  }

  let s = beginPlayerTurn(state)
  const combatAfter = s.state.combat
  if (!combatAfter) return { state: s.state, events: s.events }
  const next = setPhase(
    { ...s.state, combat: { ...combatAfter, pendingTurnStartDraw: false } },
    'COMBAT_PLAYER_READY',
  )
  return { state: next, events: s.events }
}

function enemyTakeTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  if (!state.combat) return { state, events: [] }
  let s = state
  const events: GameEvent[] = []
  const aliveIds = [...state.combat.enemies.aliveIds]

  for (const enemyId of aliveIds) {
    const ench = applyEnchantmentTurnStartForEnemy(s, enemyId)
    s = ench.state
    events.push(...ench.events)

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
    events.push(...resolved.events)
    if (intent.kind === 'ATTACK') {
      const str = Math.max(0, enemyNow.strength)
      events.push({ type: 'EVT/PLAYER_HIT', amount: intent.damage + str })
    }
    if (resolved.playerDied) {
      const name = Enemies[enemyNow.templateId]?.name ?? enemyNow.templateId
      const lvl = Enemies[enemyNow.templateId]?.level ?? s.level
      const combatAfterDeath = s.combat
      if (combatAfterDeath) {
        s = {
          ...s,
          defeat: { enemyName: name, level: lvl },
          combat: { ...combatAfterDeath, playerDefeatPending: true },
        }
      }
      events.push({ type: 'EVT/UNIT_DIED', unit: 'PLAYER' })
      break
    }
  }

  return { state: s, events }
}

function beginPlayerTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat0 = state.combat
  if (!combat0 || livingEnemyCount(combat0) === 0) return { state, events: [] }

  // Refill energy and advance combat turn (first round is turn 1 at combat start; increments after each enemy phase).
  const nextCombat = {
    ...combat0,
    turn: combat0.turn + 1,
    nextSpellCosts0: false,
    cardsPlayedThisTurn: 0,
    paintbrushTriggeredThisTurn: false,
  }
  let s: GameState = {
    ...state,
    combat: nextCombat,
    player: {
      ...state.player,
      shield: 0,
      energy: combatEffectiveMaxEnergy({ ...state, combat: nextCombat }),
    },
  }

  // Turn-start effects should resolve after the temporary shield reset.
  const ench = applyEnchantmentTurnStartForPlayer(s)
  s = ench.state

  // Turn 1 drain is applied in startCombat; later turns drain here.
  const boonEvents: GameEvent[] = []
  if (combat0.turn > 1) {
    const drained = applyDrainingAtPlayerTurnStart(s)
    s = drained.state
    boonEvents.push(...drained.events)
  }

  const turnStart = applyTurnStartRelicTriggers(s)
  s = turnStart.state

  // Roll intents for next enemy turn.
  s = rollEnemyIntent(s)
  // Draw starting hand for the turn (base hand size + combat modifiers).
  s = shuffleDiscardIntoDrawIfNeeded(s)
  const handDraw = drawCards(s, combatRefreshDrawCount(s, 0))
  return { state: handDraw.state, events: [...ench.events, ...boonEvents, ...turnStart.events, ...handDraw.events] }
}

