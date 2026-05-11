import type { GameState } from '../../core/types/state'
import type { CardInstanceId, EnemyInstanceId } from '../../core/types/ids'
import type { Effect } from '../../data/effects'
import type { GameEvent } from '../../reducers/events'
import { Cards } from '../../data/cards'
import { drawCards } from './zones'
import { normalizeBunnies } from '../bunnies'
import { boostFireDealDamage, cardHasFireDamageTags } from '../cards/firepower'
import { upgradeSpecificCards } from '../cards/upgrades'
import { damageEnemy } from './damageEnemy'

/** When set, ADD_BUNNIES from played card effects gains +player.power per stack (not used for relic pipelines). */
export type ApplyEffectsOptions = Readonly<{
  powerBoostsCardAddBunnies?: boolean
  firepowerBoostsCardDealDamage?: boolean
}>

export function applyEffects(
  state: GameState,
  effects: ReadonlyArray<Effect>,
  ctx: Readonly<{ selectedEnemyId: EnemyInstanceId | null; playedCardInstanceId: CardInstanceId }>,
  opts?: ApplyEffectsOptions,
): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []

  for (const fx of effects) {
    if (fx.kind === 'DRAW_CARDS') {
      s = drawCards(s, fx.amount)
    } else if (fx.kind === 'ADD_BUNNIES') {
      const bonus = opts?.powerBoostsCardAddBunnies ? s.player.power : 0
      const amt = fx.amount + bonus
      s = { ...s, player: { ...s.player, bunnies: normalizeBunnies(s.player.bunnies + amt) } }
    } else if (fx.kind === 'MULTIPLY_BUNNIES') {
      s = { ...s, player: { ...s.player, bunnies: normalizeBunnies(s.player.bunnies * fx.amount) } }
    } else if (fx.kind === 'HEAL') {
      const nextHp = Math.min(s.player.maxHp, s.player.hp + fx.amount)
      s = { ...s, player: { ...s.player, hp: nextHp } }
    } else if (fx.kind === 'GAIN_SHIELD') {
      const target = fx.target ?? 'player'
      if (target === 'player') {
        s = { ...s, player: { ...s.player, shield: s.player.shield + fx.amount } }
      } else if (target === 'selectedEnemy' && ctx.selectedEnemyId && s.combat) {
        const id = ctx.selectedEnemyId
        const c = s.combat
        const e = c.enemies.enemyById[id]
        if (e) {
          s = {
            ...s,
            combat: {
              ...c,
              enemies: {
                ...c.enemies,
                enemyById: { ...c.enemies.enemyById, [id]: { ...e, shield: e.shield + fx.amount } },
              },
            },
          }
        }
      }
    } else if (fx.kind === 'GAIN_LOCKED_SHIELD') {
      s = { ...s, player: { ...s.player, lockedShield: s.player.lockedShield + fx.amount } }
    } else if (fx.kind === 'LOCK_ALL_SHIELD') {
      const moved = Math.max(0, s.player.shield)
      s = {
        ...s,
        player: {
          ...s.player,
          shield: 0,
          lockedShield: s.player.lockedShield + moved,
        },
      }
    } else if (fx.kind === 'DEAL_DAMAGE') {
      if (ctx.selectedEnemyId) {
        let damage = fx.amount
        if (opts?.firepowerBoostsCardDealDamage && ctx.playedCardInstanceId) {
          const inst = s.player.deck.cardById[ctx.playedCardInstanceId]
          const tmpl = inst ? Cards[inst.templateId] : null
          if (tmpl && cardHasFireDamageTags(tmpl.tags)) {
            damage = boostFireDealDamage(fx.amount, s.player.firepowerMultiplier)
          }
        }
        const out = damageEnemy(s, ctx.selectedEnemyId, damage)
        s = out.state
        events.push(...out.events)
      }
    } else if (fx.kind === 'GAIN_MAX_HP') {
      const nextMax = s.player.maxHp + fx.amount
      const nextHp = Math.min(nextMax, s.player.hp + fx.amount)
      s = { ...s, player: { ...s.player, maxHp: nextMax, hp: nextHp } }
    } else if (fx.kind === 'GAIN_GOLD') {
      s = { ...s, player: { ...s.player, gold: s.player.gold + fx.amount } }
    } else if (fx.kind === 'GAIN_KEYS') {
      s = { ...s, player: { ...s.player, keys: s.player.keys + fx.amount } }
    } else if (fx.kind === 'GAIN_POWER') {
      s = { ...s, player: { ...s.player, power: s.player.power + fx.amount } }
    } else if (fx.kind === 'GAIN_INK') {
      // Ink maps to energy in MVP. Intentionally allowed to exceed max ink.
      s = { ...s, player: { ...s.player, energy: s.player.energy + fx.amount } }
    } else if (fx.kind === 'GAIN_MAX_INK') {
      // Max ink maps to maxEnergy in MVP.
      s = { ...s, player: { ...s.player, maxEnergy: s.player.maxEnergy + fx.amount } }
    } else if (fx.kind === 'UPGRADE_SELECTED_CARD') {
      // Resolved interactively after hand selection (see playCard).
    } else if (fx.kind === 'CONSUME_SELECTED_CARD') {
      // Resolved interactively after hand selection (see playCard).
    } else if (fx.kind === 'UPGRADE_SPECIFIC_CARD') {
      s = upgradeSpecificCards(s, fx.target, fx.numberOfTargets, fx.upgradeAmount)
    }
  }

  return { state: s, events }
}

export { scaleCardEffects } from '../cards/upgrades'

