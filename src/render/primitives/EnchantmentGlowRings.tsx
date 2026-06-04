import type { CSSProperties, RefObject } from 'react'
import type { EnchantmentInstance, EnchantmentRender } from '../../core/types/enchantments'
import { Enchantments } from '../../data/enchantments'
import {
  displayEnchantmentPoisonHpLoss,
  displayFireDamage,
  displayShieldGain,
  type PowerDisplayContext,
} from '../../systems/combat/powerDisplay'
import type { CardDescSegment } from '../../ui/describe'
import { tooltipAmountSegments } from '../../ui/tooltipAmountSegments'
import { BubbleEnchantmentPopDetector } from './BubbleEnchantmentPopDetector'
import { AntiMagicShellEnchantmentPopDetector } from './AntiMagicShellEnchantmentPopDetector'
import type { EnchantmentSpriteTriggerTarget } from '../EnchantmentSpriteTriggerFxContext'
import { EnchantmentSpriteOverlays, type EnchantmentSpriteOverlayStack } from './EnchantmentSpriteOverlays'

export type EnchantmentStackDisplay = Readonly<{
  key: string
  templateId: string
  name: string
  tooltipText: string
  /** When set, tooltip shows base vs modified amount (green / red) like card effect text. */
  tooltipAmountSegments?: ReadonlyArray<CardDescSegment>
  color?: string
  render?: EnchantmentRender
  count: number
}>

function primaryBaseAmount(templateId: string): number | null {
  const t = Enchantments[templateId]
  if (!t) return null
  if (t.ability.kind === 'STATIC') {
    const fx =
      t.ability.effects.find((e) => e.kind === 'ADD_POWER') ??
      t.ability.effects.find((e) => e.kind === 'ADD_FIREPOWER') ??
      t.ability.effects.find((e) => e.kind === 'ADD_SHIELD_POWER') ??
      t.ability.effects.find((e) => e.kind === 'GAIN_MAX_HP') ??
      t.ability.effects.find((e) => e.kind === 'REDUCE_HAND_DRAW') ??
      t.ability.effects.find((e) => e.kind === 'DECREASE_SHIELD_POWER') ??
      t.ability.effects.find((e) => e.kind === 'REDUCE_INCOMING_DAMAGE') ??
      t.ability.effects.find((e) => e.kind === 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS') ??
      t.ability.effects.find((e) => e.kind === 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS')
    if (
      fx?.kind === 'REDUCE_INCOMING_DAMAGE' ||
      fx?.kind === 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS' ||
      fx?.kind === 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS'
    ) {
      return fx.percent
    }
    return fx?.amount ?? null
  }
  if (t.ability.kind === 'TRIGGERED') {
    const fx =
      t.ability.effects.find((e) => e.kind === 'HP_LOSS') ??
      t.ability.effects.find((e) => e.kind === 'DEAL_DAMAGE') ??
      t.ability.effects.find((e) => e.kind === 'GAIN_SHIELD') ??
      t.ability.effects.find((e) => e.kind === 'GAIN_TEMPORARY_BUNNY_POWER')
    return fx?.amount ?? null
  }
  return null
}

function formatTooltipText(templateId: string, amount: number): string {
  const t = Enchantments[templateId]
  const raw = t?.tooltipText ?? ''
  if (!raw) return raw
  if (raw.includes('$amount')) return raw.split('$amount').join(String(amount))
  if (raw.includes('$damageamount')) return raw.split('$damageamount').join(String(amount))
  if (raw.includes('$percent')) return raw.split('$percent').join(String(amount))
  // Percent-based resists use a fixed tooltip per stack (multiplicative, not additive).
  if (
    t?.ability.kind === 'STATIC' &&
    t.ability.effects.some(
      (e) =>
        e.kind === 'REDUCE_INCOMING_DAMAGE' ||
        e.kind === 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS' ||
        e.kind === 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS',
    )
  ) {
    return raw
  }
  // Fallback: replace the first integer-looking number.
  return raw.replace(/\d+/, String(amount))
}

function enchantmentTooltipFields(
  templateId: string,
  baseAmount: number,
  displayAmount: number,
): Pick<EnchantmentStackDisplay, 'tooltipText' | 'tooltipAmountSegments'> {
  const raw = Enchantments[templateId]?.tooltipText ?? ''
  const segments = tooltipAmountSegments(raw, baseAmount, displayAmount)
  return {
    tooltipText: formatTooltipText(templateId, displayAmount),
    ...(segments ? { tooltipAmountSegments: segments } : {}),
  }
}

function displayEnchantmentAmount(
  inst: EnchantmentInstance,
  templateId: string,
  amount: number,
  powerDisplay: PowerDisplayContext,
): number {
  const t = Enchantments[templateId]
  if (!t) return amount
  if (
    t.ability.kind === 'STATIC' &&
    t.ability.effects.some(
      (e) =>
        e.kind === 'REDUCE_INCOMING_DAMAGE' ||
        e.kind === 'INCREASE_INCOMING_DAMAGE_AND_HPLOSS' ||
        e.kind === 'DECREASE_OUTGOING_DAMAGE_AND_HPLOSS',
    )
  ) {
    return amount
  }
  if (t.ability.kind === 'TRIGGERED') {
    if (t.tags.includes('poison') && t.ability.effects.some((fx) => fx.kind === 'HP_LOSS')) {
      return displayEnchantmentPoisonHpLoss(amount, powerDisplay, inst)
    }
    if (t.tags.includes('fire') && t.ability.effects.some((fx) => fx.kind === 'DEAL_DAMAGE')) {
      return displayFireDamage(amount, powerDisplay)
    }
    if (t.ability.effects.some((fx) => fx.kind === 'GAIN_SHIELD') && inst.target.kind === 'PLAYER') {
      return displayShieldGain(amount, powerDisplay, true)
    }
  }
  return amount
}

export function enchantmentStacksForTarget(
  instances: ReadonlyArray<EnchantmentInstance>,
  powerDisplay: PowerDisplayContext,
): ReadonlyArray<EnchantmentStackDisplay> {
  if (!instances.length) return []

  const byTemplate: Record<string, { instances: EnchantmentInstance[] }> = {}
  for (const inst of instances) {
    const tid = inst.templateId
    const entry = byTemplate[tid] ?? (byTemplate[tid] = { instances: [] })
    entry.instances.push(inst)
  }

  const out: EnchantmentStackDisplay[] = []
  for (const [templateId, grp] of Object.entries(byTemplate)) {
    const t = Enchantments[templateId]
    if (!t) continue
    const stackable = t.stackable ?? false
    if (stackable) {
      const base = primaryBaseAmount(templateId) ?? 0
      const baseTotal = grp.instances.reduce((sum, inst) => sum + (inst.amountOverride ?? base), 0)
      const displayTotal = grp.instances.reduce(
        (sum, inst) =>
          sum + displayEnchantmentAmount(inst, templateId, inst.amountOverride ?? base, powerDisplay),
        0,
      )
      const tooltip =
        templateId === 'ANTI_MAGIC_SHELL'
          ? enchantmentTooltipFields(templateId, grp.instances.length, grp.instances.length)
          : enchantmentTooltipFields(templateId, baseTotal, displayTotal)
      out.push({
        key: `stack-${templateId}`,
        templateId,
        name: t.name,
        ...tooltip,
        color: t.color,
        render: t.render,
        count: grp.instances.length,
      })
    } else {
      const base = primaryBaseAmount(templateId) ?? 0
      for (const inst of grp.instances) {
        const amt = inst.amountOverride ?? base
        const displayAmt = displayEnchantmentAmount(inst, templateId, amt, powerDisplay)
        out.push({
          key: `inst-${inst.id}`,
          templateId,
          name: t.name,
          ...enchantmentTooltipFields(templateId, amt, displayAmt),
          color: t.color,
          render: t.render,
          count: 1,
        })
      }
    }
  }

  // Stable ordering: deterministic ring radii based on templateId then key.
  out.sort((a, b) => (a.templateId === b.templateId ? a.key.localeCompare(b.key) : a.templateId.localeCompare(b.templateId)))
  return out
}

export type EnchantmentGlowRingsProps = Readonly<{
  stacks: ReadonlyArray<EnchantmentStackDisplay>
}>

export function EnchantmentGlowRings(props: EnchantmentGlowRingsProps) {
  const { stacks } = props
  const ringStacks = stacks.filter((s): s is EnchantmentStackDisplay & { color: string } => !!s.color)
  if (!ringStacks.length) return null

  return (
    <div className="enchantmentGlowRings" aria-hidden>
      {ringStacks.map((s, idx) => (
        <div
          key={s.key}
          className="enchantmentGlowRing"
          style={
            {
              ['--enchantment-ring-index' as any]: idx,
              ['--enchantment-ring-color' as any]: s.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** True when flamewreath crown should paint above the combat health bar (see --enchantment-fire-crown-above-bar-z). */
export function hasFireCrownEnchantmentOverlay(
  stacks: ReadonlyArray<EnchantmentStackDisplay>,
): boolean {
  return stacks.some(
    (s) => s.render?.kind === 'SPRITE_OVERLAY' && s.render.sprite === 'FIRE_CROWN' && s.count > 0,
  )
}

function spriteOverlayStacks(stacks: ReadonlyArray<EnchantmentStackDisplay>): ReadonlyArray<EnchantmentSpriteOverlayStack> {
  return stacks
    .filter((s): s is EnchantmentStackDisplay & { render: EnchantmentRender } => s.render?.kind === 'SPRITE_OVERLAY')
    .map((s) => ({ key: s.key, render: s.render, count: s.count }))
}

export type EnchantmentVisualsProps = Readonly<{
  stacks: ReadonlyArray<EnchantmentStackDisplay>
  /** Placeholder root (kept for API stability / other visuals). */
  anchorRef: RefObject<HTMLElement | null>
  /** Target for sprite trigger pulse FX (e.g. poison darken on HP loss). */
  spriteTriggerTarget?: EnchantmentSpriteTriggerTarget
}>

/** Glow rings for color-based enchantments plus sprite overlays (e.g. Bubble). */
export function EnchantmentVisuals(props: EnchantmentVisualsProps) {
  const { stacks, anchorRef, spriteTriggerTarget } = props
  const overlays = spriteOverlayStacks(stacks)
  const bubbleOverlays = overlays.filter((o) => o.render.sprite === 'BUBBLE')
  const antiMagicShellOverlays = overlays.filter((o) => o.render.sprite === 'ANTI_MAGIC_SHELL')
  const hasGlowRings = stacks.some((s) => s.color)
  const hasIdleSprites = overlays.some((s) => s.count > 0)

  return (
    <>
      <BubbleEnchantmentPopDetector stacks={bubbleOverlays} anchorRef={anchorRef} />
      <AntiMagicShellEnchantmentPopDetector stacks={antiMagicShellOverlays} anchorRef={anchorRef} />
      {hasGlowRings ? <EnchantmentGlowRings stacks={stacks} /> : null}
      {hasIdleSprites ? (
        <EnchantmentSpriteOverlays stacks={overlays} spriteTriggerTarget={spriteTriggerTarget} />
      ) : null}
    </>
  )
}

export function enchantmentTooltipEntries(
  stacks: ReadonlyArray<EnchantmentStackDisplay>,
): ReadonlyArray<Readonly<{ key: string; label: string; text?: string }>> {
  return stacks.map((s) => ({
    key: `enchTip-${s.key}`,
    label: s.count > 1 ? `${s.count}x ${s.name}` : s.name,
    text: s.tooltipAmountSegments ? undefined : s.tooltipText,
    textSegments: s.tooltipAmountSegments,
  }))
}

