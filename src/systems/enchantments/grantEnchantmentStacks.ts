import type { EnchantmentTargetRef, EnchantmentOwner, EnchantmentInstance } from '../../core/types/enchantments'
import type { EnchantmentId, EnchantmentInstanceId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { Enchantments } from '../../data/enchantments'
import { applyStaticEnchantmentOnGain } from './staticEffects'
import { consumeOneAntiMagicShellInstance, ANTI_MAGIC_SHELL_ENCHANTMENT_ID } from './antiMagicShell'

function sameEnchantmentTarget(a: EnchantmentTargetRef, b: EnchantmentTargetRef): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentTargetRef, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

function sameEnchantmentOwner(a: EnchantmentOwner, b: EnchantmentOwner): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ENEMY') return a.enemyInstanceId === (b as Extract<EnchantmentOwner, { kind: 'ENEMY' }>).enemyInstanceId
  return true
}

function ownerOfTarget(target: EnchantmentTargetRef): EnchantmentOwner | null {
  if (target.kind === 'PLAYER') return { kind: 'PLAYER' }
  if (target.kind === 'ENEMY') return { kind: 'ENEMY', enemyInstanceId: target.enemyInstanceId }
  return null
}

/** Adds `stacks` instances of `templateId` on `target` (skips when non-stackable and already present). */
export function grantEnchantmentStacks(
  state: GameState,
  opts: Readonly<{
    templateId: EnchantmentId
    target: EnchantmentTargetRef
    owner: EnchantmentOwner
    stacks: number
    amountOverride?: number
  }>,
): GameState {
  const combat0 = state.combat
  if (!combat0) return state
  const tmpl = Enchantments[opts.templateId]
  if (!tmpl) return state

  // Anti-Magic Shell: when the target is hit by an enchantment they don't own, negate it and consume 1 shell stack.
  if (opts.target.kind !== 'GLOBAL' && opts.templateId !== ANTI_MAGIC_SHELL_ENCHANTMENT_ID) {
    const targetOwner = ownerOfTarget(opts.target)
    if (targetOwner && !sameEnchantmentOwner(targetOwner, opts.owner)) {
      const shell = consumeOneAntiMagicShellInstance(state, opts.target)
      if (shell.consumed) return shell.state
    }
  }

  const stackable = tmpl.stackable ?? false
  if (!stackable) {
    const already = combat0.enchantments.some(
      (e) => e.templateId === opts.templateId && sameEnchantmentTarget(e.target, opts.target),
    )
    if (already) return state
  }

  const stacksToAdd = Math.max(0, opts.stacks)
  if (stacksToAdd <= 0) return state

  let combatWorking = combat0
  let sWorking = state
  for (let i = 0; i < stacksToAdd; i++) {
    const instId = (`ench${combatWorking.nextEnchantmentInstanceSerial}` as unknown) as EnchantmentInstanceId
    const nextInst: EnchantmentInstance = {
      id: instId,
      templateId: opts.templateId,
      owner: opts.owner,
      target: opts.target,
      amountOverride: opts.amountOverride,
    }
    combatWorking = {
      ...combatWorking,
      enchantments: [...combatWorking.enchantments, nextInst],
      nextEnchantmentInstanceSerial: combatWorking.nextEnchantmentInstanceSerial + 1,
    }
    sWorking = { ...sWorking, combat: combatWorking }
    sWorking = applyStaticEnchantmentOnGain(sWorking, nextInst)
  }
  return sWorking
}
