import type { CSSProperties } from 'react'
import type { EnchantmentInstance } from '../../core/types/enchantments'
import { Enchantments } from '../../data/enchantments'
import { boostFireDealDamage } from '../../systems/cards/firepower'

type EnchantmentStackDisplay = Readonly<{
  key: string
  templateId: string
  name: string
  tooltipText: string
  color: string
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
      t.ability.effects.find((e) => e.kind === 'GAIN_MAX_HP')
    return fx?.amount ?? null
  }
  if (t.ability.kind === 'TRIGGERED') {
    const fx = t.ability.effects.find((e) => e.kind === 'HP_LOSS') ?? t.ability.effects.find((e) => e.kind === 'DEAL_DAMAGE')
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
  // Fallback: replace the first integer-looking number.
  return raw.replace(/\d+/, String(amount))
}

function displayEnchantmentAmount(
  inst: EnchantmentInstance,
  templateId: string,
  amount: number,
  firepower: number,
  firepowerMultiplier: number,
  hasGreenHat: boolean,
): number {
  const t = Enchantments[templateId]
  if (hasGreenHat && t?.tags.includes('poison') && t.ability.kind === 'TRIGGERED' && t.ability.effects.some((fx) => fx.kind === 'HP_LOSS')) {
    if (inst.owner.kind === 'PLAYER') return Math.ceil(amount * 1.5)
    if (inst.target.kind === 'PLAYER' && inst.owner.kind === 'ENEMY') return Math.ceil(amount * 0.5)
  }
  if (!t?.tags.includes('fire')) return amount
  if (t.ability.kind !== 'TRIGGERED') return amount
  if (!t.ability.effects.some((fx) => fx.kind === 'DEAL_DAMAGE')) return amount
  return boostFireDealDamage(amount, firepower, firepowerMultiplier)
}

export function enchantmentStacksForTarget(
  instances: ReadonlyArray<EnchantmentInstance>,
  firepower = 0,
  firepowerMultiplier = 0,
  hasGreenHat = false,
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
      const displayTotal = grp.instances.reduce(
        (sum, inst) =>
          sum + displayEnchantmentAmount(inst, templateId, inst.amountOverride ?? base, firepower, firepowerMultiplier, hasGreenHat),
        0,
      )
      out.push({
        key: `stack-${templateId}`,
        templateId,
        name: t.name,
        tooltipText: formatTooltipText(templateId, displayTotal),
        color: t.color,
        count: grp.instances.length,
      })
    } else {
      const base = primaryBaseAmount(templateId) ?? 0
      for (const inst of grp.instances) {
        const amt = inst.amountOverride ?? base
        const displayAmt = displayEnchantmentAmount(inst, templateId, amt, firepower, firepowerMultiplier, hasGreenHat)
        out.push({
          key: `inst-${inst.id}`,
          templateId,
          name: t.name,
          tooltipText: formatTooltipText(templateId, displayAmt),
          color: t.color,
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
  if (!stacks.length) return null

  return (
    <div className="enchantmentGlowRings" aria-hidden>
      {stacks.map((s, idx) => (
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

export function enchantmentTooltipEntries(
  stacks: ReadonlyArray<EnchantmentStackDisplay>,
): ReadonlyArray<Readonly<{ key: string; label: string; text?: string }>> {
  return stacks.map((s) => ({
    key: `enchTip-${s.key}`,
    label: s.count > 1 ? `${s.count}x ${s.name}` : s.name,
    text: s.tooltipText,
  }))
}

