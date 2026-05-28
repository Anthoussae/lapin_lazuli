import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnchantmentInstance } from '../../core/types/enchantments'
import type { GameState } from '../../core/types/state'
import type { GameEvent } from '../../reducers/events'
import { Enchantments } from '../../data/enchantments'

function playerHasGreenHat(state: GameState): boolean {
  return state.player.relics.some((r) => r.templateId === 'GREEN_HAT')
}

function poisonResist50Ceil(n: number): number {
  return Math.ceil(n * 0.5)
}

function poisonBoost50Ceil(n: number): number {
  return Math.ceil(n * 1.5)
}

export function applyEnchantmentTurnStartForPlayer(state: GameState): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat) return { state, events: [] }
  const relevant = combat.enchantments.filter((e) => e.target.kind === 'PLAYER')
  return applyTurnStartForTarget(state, relevant)
}

export function applyEnchantmentTurnStartForEnemy(
  state: GameState,
  enemyInstanceId: EnemyInstanceId,
): { state: GameState; events: GameEvent[] } {
  const combat = state.combat
  if (!combat) return { state, events: [] }
  const relevant = combat.enchantments.filter((e) => e.target.kind === 'ENEMY' && e.target.enemyInstanceId === enemyInstanceId)
  return applyTurnStartForTarget(state, relevant)
}

function applyTurnStartForTarget(
  state: GameState,
  instances: ReadonlyArray<EnchantmentInstance>,
): { state: GameState; events: GameEvent[] } {
  let s = state
  const events: GameEvent[] = []

  for (const inst of instances) {
    const tmpl = Enchantments[inst.templateId]
    if (!tmpl || tmpl.ability.kind !== 'TRIGGERED') continue
    if (tmpl.ability.trigger !== 'onTargetTurnStart') continue

    for (const fx of tmpl.ability.effects) {
      if (fx.kind === 'HP_LOSS') {
        let amt = inst.amountOverride ?? fx.amount
        if (amt > 0 && tmpl.tags.includes('poison') && playerHasGreenHat(s)) {
          if (inst.target.kind === 'PLAYER' && inst.owner.kind === 'ENEMY') amt = poisonResist50Ceil(amt)
          if (inst.owner.kind === 'PLAYER') amt = poisonBoost50Ceil(amt)
        }
        if (amt <= 0) continue
        if (inst.target.kind === 'PLAYER') {
          const nextHp = s.player.hp - amt
          const died = s.player.hp > 0 && nextHp <= 0
          s = { ...s, player: { ...s.player, hp: nextHp } }
          if (died) {
            const combat0 = s.combat
            if (combat0) s = { ...s, combat: { ...combat0, playerDefeatPending: true } }
            events.push({ type: 'EVT/UNIT_DIED', unit: 'PLAYER' })
          }
        } else if (inst.target.kind === 'ENEMY' && s.combat) {
          const combat0 = s.combat
          const e0 = combat0.enemies.enemyById[inst.target.enemyInstanceId]
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
      }
      if (fx.kind === 'GAIN_SHIELD') {
        const amt = inst.amountOverride ?? fx.amount
        if (amt <= 0) continue

        if (inst.target.kind === 'PLAYER') {
          s = { ...s, player: { ...s.player, shield: s.player.shield + amt } }
        } else if (inst.target.kind === 'ENEMY' && s.combat) {
          const combat0 = s.combat
          const e0 = combat0.enemies.enemyById[inst.target.enemyInstanceId]
          if (!e0 || e0.hp <= 0) continue
          const enemyById2 = { ...combat0.enemies.enemyById, [e0.id]: { ...e0, shield: e0.shield + amt } }
          s = { ...s, combat: { ...combat0, enemies: { ...combat0.enemies, enemyById: enemyById2 } } }
        }
      }
    }
  }

  return { state: s, events }
}

