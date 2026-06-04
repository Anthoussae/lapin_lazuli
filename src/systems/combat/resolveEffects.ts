import type { GameState } from '../../core/types/state'
import type { CardInstanceId, EnemyInstanceId } from '../../core/types/ids'
import type { Effect } from '../../data/effects'
import type { GameEvent } from '../../reducers/events'
import { Cards } from '../../data/cards'
import type { EnchantmentTargetRef } from '../../core/types/enchantments'
import { Enchantments } from '../../data/enchantments'
import { drawCards } from './zones'
import { bunnySummonsTotalBunnies } from '../cards/bunnySummons'
import { multiplyBunnies, normalizeBunnies } from '../bunnies'
import { cardInstanceHasFireDamage } from '../cards/fireRelease'
import { cardHasFireDamageTags } from '../cards/firepower'
import { cardHasAddShieldTag, resolveShieldGainAmount } from '../cards/shieldPower'
import { upgradeRandomDeckCards, upgradeSpecificCards } from '../cards/upgrades'
import { addCombatFirepower, addCombatPower, addCombatShieldPower, effectivePower, effectiveShieldPower } from './combatBonuses'
import {
  displayCardPoisonHpLoss,
  displayFireDamage,
  powerDisplayContextFromState,
} from './powerDisplay'
import { damageEnemy } from './damageEnemy'
import { shatterEnemyShields } from './shatter'
import { applyHpLossMaybeBubble, BUBBLE_ENCHANTMENT_ID } from '../enchantments/bubble'
import { applyIncomingDamageAndHpLossModifiers } from '../enchantments/incomingDamageModifiers'
import { applyOutgoingDamageAndHpLossModifiers } from '../enchantments/outgoingDamageReduction'
import { dispelOpponentEnchantments } from '../enchantments/dispel'
import { grantEnchantmentStacks } from '../enchantments/grantEnchantmentStacks'
import { shieldPowerPenaltyFromEnchantments } from '../enchantments/staticEffects'

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
    if (fx.kind === 'CRITICAL') continue
    if (fx.kind === 'DRAW_CARDS') {
      const drew = drawCards(s, fx.amount)
      s = drew.state
      events.push(...drew.events)
    } else if (fx.kind === 'ADD_BUNNIES') {
      const bonus = opts?.powerBoostsCardAddBunnies ? effectivePower(s) : 0
      const amt = fx.amount + bonus
      s = { ...s, player: { ...s.player, bunnies: normalizeBunnies(s.player.bunnies + amt) } }
    } else if (fx.kind === 'ADD_BUNNIES_EQUAL_TO_GAME_LEVEL') {
      const bonus = opts?.powerBoostsCardAddBunnies ? effectivePower(s) : 0
      const amt = bunnySummonsTotalBunnies(fx, s.level, bonus)
      s = { ...s, player: { ...s.player, bunnies: normalizeBunnies(s.player.bunnies + amt) } }
    } else if (fx.kind === 'MULTIPLY_BUNNIES') {
      s = {
        ...s,
        player: { ...s.player, bunnies: multiplyBunnies(s.player.bunnies, fx.amount) },
      }
    } else if (fx.kind === 'HEAL') {
      const nextHp = Math.min(s.player.maxHp, s.player.hp + fx.amount)
      s = { ...s, player: { ...s.player, hp: nextHp } }
    } else if (fx.kind === 'HP_LOSS') {
      const target = fx.target ?? 'selectedEnemy'
      let amt = Math.max(0, fx.amount)
      let isPoison = false
      if (amt > 0 && ctx.playedCardInstanceId) {
        const inst = s.player.deck.cardById[ctx.playedCardInstanceId]
        const tmpl = inst ? Cards[inst.templateId] : null
        if (tmpl?.tags.includes('poison')) {
          isPoison = true
          const pCtx = powerDisplayContextFromState(s)
          const poisonTarget = target === 'player' ? 'player' : 'selectedEnemy'
          amt = displayCardPoisonHpLoss(amt, pCtx, poisonTarget)
        }
      }
      if (amt <= 0) continue
      const targetRef =
        target === 'player'
          ? ({ kind: 'PLAYER' } as const)
          : ctx.selectedEnemyId
            ? ({ kind: 'ENEMY', enemyInstanceId: ctx.selectedEnemyId } as const)
            : null
      if (targetRef) {
        amt = applyOutgoingDamageAndHpLossModifiers(s, { kind: 'PLAYER' }, amt)
        amt = applyIncomingDamageAndHpLossModifiers(s, targetRef, amt, isPoison ? { damageType: 'POISON' } : undefined)
      }
      if (amt <= 0) continue
      if (target === 'player') {
        const loss = applyHpLossMaybeBubble(s, { kind: 'PLAYER' }, s.player.hp, amt)
        s = loss.state
        const nextHp = loss.nextHp
        const died = loss.lossApplied && s.player.hp > 0 && nextHp <= 0
        s = { ...s, player: { ...s.player, hp: nextHp } }
        if (isPoison && loss.lossApplied && ctx.playedCardInstanceId) {
          pushPoisonCardHpLossEvent(events, 'PLAYER', ctx.playedCardInstanceId)
        }
        if (died) {
          const combat0 = s.combat
          if (combat0) s = { ...s, combat: { ...combat0, playerDefeatPending: true } }
          events.push({ type: 'EVT/UNIT_DIED', unit: 'PLAYER' })
        }
      } else if (target === 'selectedEnemy' && ctx.selectedEnemyId && s.combat) {
        const e0 = s.combat.enemies.enemyById[ctx.selectedEnemyId]
        if (!e0 || e0.hp <= 0) continue
        const loss = applyHpLossMaybeBubble(s, { kind: 'ENEMY', enemyInstanceId: e0.id }, e0.hp, amt)
        s = loss.state
        const combatAfterBubble = s.combat
        if (!combatAfterBubble) continue
        const enemyAfterBubble = combatAfterBubble.enemies.enemyById[e0.id]
        if (!enemyAfterBubble) continue
        const nextHp = loss.nextHp
        const died = loss.lossApplied && e0.hp > 0 && nextHp <= 0
        s = {
          ...s,
          combat: {
            ...combatAfterBubble,
            monsterDefeatPending: died ? e0.id : combatAfterBubble.monsterDefeatPending,
            enemies: {
              ...combatAfterBubble.enemies,
              enemyById: { ...combatAfterBubble.enemies.enemyById, [e0.id]: { ...enemyAfterBubble, hp: nextHp } },
            },
          },
        }
        if (isPoison && loss.lossApplied && ctx.playedCardInstanceId) {
          pushPoisonCardHpLossEvent(events, e0.id, ctx.playedCardInstanceId)
        }
        if (died) events.push({ type: 'EVT/UNIT_DIED', unit: e0.id })
      }
    } else if (fx.kind === 'GAIN_SHIELD') {
      const target = fx.target ?? 'player'
      if (target === 'player') {
        let appliesShieldPowerBoost = false
        if (opts?.shieldPowerBoostsCardGainShield && ctx.playedCardInstanceId) {
          const inst = s.player.deck.cardById[ctx.playedCardInstanceId]
          const tmpl = inst ? Cards[inst.templateId] : null
          appliesShieldPowerBoost = !!(tmpl && cardHasAddShieldTag(tmpl.tags))
        }
        const amount = resolveShieldGainAmount(
          fx.amount,
          effectiveShieldPower(s),
          shieldPowerPenaltyFromEnchantments(s, { kind: 'PLAYER' }),
          appliesShieldPowerBoost,
        )
        if (amount <= 0) continue
        s = { ...s, player: { ...s.player, shield: s.player.shield + amount } }
      } else if (target === 'selectedEnemy' && ctx.selectedEnemyId && s.combat) {
        const id = ctx.selectedEnemyId
        const c = s.combat
        const e = c.enemies.enemyById[id]
        if (e) {
          const amount = resolveShieldGainAmount(
            fx.amount,
            0,
            shieldPowerPenaltyFromEnchantments(s, { kind: 'ENEMY', enemyInstanceId: id }),
            false,
          )
          if (amount <= 0) continue
          s = {
            ...s,
            combat: {
              ...c,
              enemies: {
                ...c.enemies,
                enemyById: { ...c.enemies.enemyById, [id]: { ...e, shield: e.shield + amount } },
              },
            },
          }
        }
      }
    } else if (fx.kind === 'GAIN_LOCKED_SHIELD') {
      const amount = resolveShieldGainAmount(
        fx.amount,
        0,
        shieldPowerPenaltyFromEnchantments(s, { kind: 'PLAYER' }),
        false,
      )
      if (amount <= 0) continue
      s = { ...s, player: { ...s.player, lockedShield: s.player.lockedShield + amount } }
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
    } else if (fx.kind === 'SHATTER') {
      if (ctx.selectedEnemyId) {
        s = shatterEnemyShields(s, ctx.selectedEnemyId)
      }
    } else if (fx.kind === 'DEAL_DAMAGE') {
      if (ctx.selectedEnemyId) {
        let damage = fx.amount
        let enemyMayDodge = false
        let isFireDamage = false
        if (opts?.firepowerBoostsCardDealDamage && ctx.playedCardInstanceId) {
          const inst = s.player.deck.cardById[ctx.playedCardInstanceId]
          const tmpl = inst ? Cards[inst.templateId] : null
          if (inst && tmpl) {
            isFireDamage = cardInstanceHasFireDamage(inst, tmpl.tags)
            enemyMayDodge = isFireDamage
            if (isFireDamage && cardHasFireDamageTags(tmpl.tags)) {
              damage = displayFireDamage(fx.amount, powerDisplayContextFromState(s))
            }
          }
        }
        const out = damageEnemy(s, ctx.selectedEnemyId, damage, {
          attacker: { kind: 'PLAYER' },
          enemyMayDodge,
          incomingDamageType: isFireDamage ? 'FIRE' : undefined,
        })
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
    } else if (fx.kind === 'GAIN_LUCK') {
      s = { ...s, player: { ...s.player, luck: s.player.luck + fx.amount } }
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
      const stacksToAdd = tmpl.id === BUBBLE_ENCHANTMENT_ID ? Math.max(1, fx.amount ?? 1) : 1
      s = grantEnchantmentStacks(s, {
        templateId: tmpl.id,
        owner: { kind: 'PLAYER' },
        target,
        stacks: stacksToAdd,
        amountOverride: tmpl.id === BUBBLE_ENCHANTMENT_ID ? undefined : fx.amount,
      })
    } else if (fx.kind === 'DISPEL') {
      s = dispelOpponentEnchantments(s, fx.amount, { kind: 'PLAYER' })
    }
  }

  return { state: s, events }
}

function pushPoisonCardHpLossEvent(
  events: GameEvent[],
  unit: 'PLAYER' | EnemyInstanceId,
  cardInstanceId: CardInstanceId,
): void {
  events.push({ type: 'EVT/POISON_CARD_HP_LOSS', unit, cardInstanceId })
}

export { applyCardInstanceEffectModifiers, scaleCardEffects } from '../cards/upgrades'

