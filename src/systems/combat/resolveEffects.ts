import type { GameState } from '../../core/types/state'
import type { CardInstanceId, EnemyInstanceId } from '../../core/types/ids'
import type { Effect } from '../../data/effects'
import type { GameEvent } from '../../reducers/events'
import { Cards } from '../../data/cards'
import type { EnchantmentTargetRef } from '../../core/types/enchantments'
import type { EnchantmentInstanceId } from '../../core/types/ids'
import { Enchantments } from '../../data/enchantments'
import { drawCards } from './zones'
import { normalizeBunnies } from '../bunnies'
import { boostFireDealDamage, cardHasFireDamageTags } from '../cards/firepower'
import { boostShieldGain, cardHasAddShieldTag } from '../cards/shieldPower'
import { upgradeRandomDeckCards, upgradeSpecificCards } from '../cards/upgrades'
import { addCombatFirepower, addCombatPower, addCombatShieldPower, effectiveFirepower, effectivePower, effectiveShieldPower } from './combatBonuses'
import { damageEnemy } from './damageEnemy'
import { dispelOpponentEnchantments } from '../enchantments/dispel'
import { applyStaticEnchantmentOnGain } from '../enchantments/staticEffects'

/** When set, ADD_BUNNIES from played card effects gains +player.power per stack (not used for relic pipelines). */
export type ApplyEffectsOptions = Readonly<{
  powerBoostsCardAddBunnies?: boolean
  shieldPowerBoostsCardGainShield?: boolean
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
      const drew = drawCards(s, fx.amount)
      s = drew.state
      events.push(...drew.events)
    } else if (fx.kind === 'ADD_BUNNIES') {
      const bonus = opts?.powerBoostsCardAddBunnies ? effectivePower(s) : 0
      const amt = fx.amount + bonus
      s = { ...s, player: { ...s.player, bunnies: normalizeBunnies(s.player.bunnies + amt) } }
    } else if (fx.kind === 'MULTIPLY_BUNNIES') {
      s = { ...s, player: { ...s.player, bunnies: normalizeBunnies(s.player.bunnies * fx.amount) } }
    } else if (fx.kind === 'HEAL') {
      const nextHp = Math.min(s.player.maxHp, s.player.hp + fx.amount)
      s = { ...s, player: { ...s.player, hp: nextHp } }
    } else if (fx.kind === 'HP_LOSS') {
      const target = fx.target ?? 'selectedEnemy'
      let amt = Math.max(0, fx.amount)
      if (amt > 0 && ctx.playedCardInstanceId) {
        const inst = s.player.deck.cardById[ctx.playedCardInstanceId]
        const tmpl = inst ? Cards[inst.templateId] : null
        const hasGreenHat = s.player.relics.some((r) => r.templateId === 'GREEN_HAT')
        if (hasGreenHat && tmpl?.tags.includes('poison')) {
          if (target === 'selectedEnemy') amt = Math.ceil(amt * 1.5)
          if (target === 'player') amt = Math.ceil(amt * 0.5)
        }
      }
      if (amt <= 0) continue
      if (target === 'player') {
        const nextHp = s.player.hp - amt
        const died = s.player.hp > 0 && nextHp <= 0
        s = { ...s, player: { ...s.player, hp: nextHp } }
        if (died) {
          const combat0 = s.combat
          if (combat0) s = { ...s, combat: { ...combat0, playerDefeatPending: true } }
          events.push({ type: 'EVT/UNIT_DIED', unit: 'PLAYER' })
        }
      } else if (target === 'selectedEnemy' && ctx.selectedEnemyId && s.combat) {
        const combat0 = s.combat
        const e0 = combat0.enemies.enemyById[ctx.selectedEnemyId]
        if (!e0 || e0.hp <= 0) continue
        const nextHp = e0.hp - amt
        const died = e0.hp > 0 && nextHp <= 0
        const enemyById2 = { ...combat0.enemies.enemyById, [e0.id]: { ...e0, hp: nextHp } }
        s = {
          ...s,
          combat: {
            ...combat0,
            monsterDefeatPending: died ? e0.id : combat0.monsterDefeatPending,
            enemies: { ...combat0.enemies, enemyById: enemyById2 },
          },
        }
        if (died) events.push({ type: 'EVT/UNIT_DIED', unit: e0.id })
      }
    } else if (fx.kind === 'GAIN_SHIELD') {
      const target = fx.target ?? 'player'
      if (target === 'player') {
        let amount = fx.amount
        if (opts?.shieldPowerBoostsCardGainShield && ctx.playedCardInstanceId) {
          const inst = s.player.deck.cardById[ctx.playedCardInstanceId]
          const tmpl = inst ? Cards[inst.templateId] : null
          if (tmpl && cardHasAddShieldTag(tmpl.tags)) {
            amount = boostShieldGain(amount, effectiveShieldPower(s))
          }
        }
        s = { ...s, player: { ...s.player, shield: s.player.shield + amount } }
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
            damage = boostFireDealDamage(fx.amount, effectiveFirepower(s), s.player.firepowerMultiplier)
          }
        }
        const out = damageEnemy(s, ctx.selectedEnemyId, damage, { attacker: { kind: 'PLAYER' } })
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
      if (fx.duration === 'combat') {
        s = addCombatPower(s, fx.amount)
      } else {
        s = { ...s, player: { ...s.player, power: s.player.power + fx.amount } }
      }
    } else if (fx.kind === 'GAIN_SHIELD_POWER') {
      if (fx.duration === 'combat') {
        s = addCombatShieldPower(s, fx.amount)
      } else {
        s = { ...s, player: { ...s.player, shieldPower: s.player.shieldPower + fx.amount } }
      }
    } else if (fx.kind === 'GAIN_FIREPOWER') {
      if (fx.duration === 'combat') {
        s = addCombatFirepower(s, fx.amount)
      } else {
        s = { ...s, player: { ...s.player, firepower: s.player.firepower + fx.amount } }
      }
    } else if (fx.kind === 'GAIN_INK') {
      // Ink maps to energy in MVP. Intentionally allowed to exceed max ink.
      s = { ...s, player: { ...s.player, energy: s.player.energy + fx.amount } }
    } else if (fx.kind === 'GAIN_MAX_INK') {
      // Max ink maps to maxEnergy in MVP.
      s = { ...s, player: { ...s.player, maxEnergy: s.player.maxEnergy + fx.amount } }
    } else if (fx.kind === 'GAIN_HAND_SIZE') {
      const next = s.player.baseHandSize + fx.amount
      s = { ...s, player: { ...s.player, baseHandSize: next, handSize: next } }
    } else if (fx.kind === 'UPGRADE_SELECTED_CARD') {
      // Resolved interactively after hand selection (see playCard).
    } else if (fx.kind === 'CONSUME_SELECTED_CARD') {
      // Resolved interactively after hand selection (see playCard).
    } else if (fx.kind === 'UPGRADE_SPECIFIC_CARD') {
      s = upgradeSpecificCards(s, fx.target, fx.numberOfTargets, fx.upgradeAmount)
    } else if (fx.kind === 'UPGRADE_RANDOM_DECK_CARDS') {
      s = upgradeRandomDeckCards(s, fx.numberOfTargets, fx.upgradeAmount)
    } else if (fx.kind === 'APPLY_ENCHANTMENT') {
      const combat0 = s.combat
      if (!combat0) continue
      const tmpl = Enchantments[fx.enchantmentId]
      if (!tmpl) continue

      const target: EnchantmentTargetRef | null =
        fx.target === 'global'
          ? { kind: 'GLOBAL' }
          : fx.target === 'self'
            ? { kind: 'PLAYER' }
            : ctx.selectedEnemyId
              ? { kind: 'ENEMY', enemyInstanceId: ctx.selectedEnemyId }
              : null
      if (!target) continue

      const stackable = tmpl.stackable ?? false
      if (!stackable) {
        const already = combat0.enchantments.some((e) => e.templateId === tmpl.id && sameEnchantmentTarget(e.target, target))
        if (already) continue
      }

      const instId = (`ench${combat0.nextEnchantmentInstanceSerial}` as unknown) as EnchantmentInstanceId
      const nextInst = {
        id: instId,
        templateId: tmpl.id,
        owner: { kind: 'PLAYER' } as const,
        target,
        amountOverride: fx.amount,
      }
      const sNext: GameState = {
        ...s,
        combat: {
          ...combat0,
          enchantments: [...combat0.enchantments, nextInst],
          nextEnchantmentInstanceSerial: combat0.nextEnchantmentInstanceSerial + 1,
        },
      }
      s = applyStaticEnchantmentOnGain(sNext, nextInst)
    } else if (fx.kind === 'DISPEL') {
      s = dispelOpponentEnchantments(s, fx.amount, { kind: 'PLAYER' })
    }
  }

  return { state: s, events }
}

function sameEnchantmentTarget(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

export { applyCardInstanceEffectModifiers, scaleCardEffects } from '../cards/upgrades'

