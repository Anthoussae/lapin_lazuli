import { useLayoutEffect, useRef, useState } from 'react'
import type { EnchantmentRender, EnchantmentSpriteOverlayId } from '../../core/types/enchantments'
import { bubblePopFxDurationMs } from '../bubblePopFxConfig'
import { antiMagicShellPopFxDurationMs } from '../antiMagicShellPopFxConfig'
import { poisonPopFxDurationMs } from '../poisonPopFxConfig'
import { fireCrownPopFxDurationMs } from '../fireCrownPopFxConfig'
import { enchantmentSpriteOverlaySrc } from '../enchantmentSpriteImages'
import {
  useEnchantmentSpriteTriggerPulse,
  type EnchantmentSpriteTriggerTarget,
} from '../EnchantmentSpriteTriggerFxContext'

export type EnchantmentSpriteOverlayStack = Readonly<{
  key: string
  render: EnchantmentRender
  count: number
}>

function overlayClassName(sprite: EnchantmentSpriteOverlayId): string {
  if (sprite === 'BUBBLE') return 'enchantmentSpriteOverlay enchantmentSpriteOverlay--bubble'
  if (sprite === 'ANTI_MAGIC_SHELL') return 'enchantmentSpriteOverlay enchantmentSpriteOverlay--antiMagicShell'
  if (sprite === 'POISON') return 'enchantmentSpriteOverlay enchantmentSpriteOverlay--poison'
  if (sprite === 'FIRE_CROWN') return 'enchantmentSpriteOverlay enchantmentSpriteOverlay--fireCrown'
  return 'enchantmentSpriteOverlay'
}

type ActiveOverlayPop = Readonly<{
  id: number
  sprite: EnchantmentSpriteOverlayId
}>

type EnchantmentSpriteOverlaysProps = Readonly<{
  stacks: ReadonlyArray<EnchantmentSpriteOverlayStack>
  /** Combat placeholder this overlay sits on (for trigger pulse FX). */
  spriteTriggerTarget?: EnchantmentSpriteTriggerTarget
}>

/** Idle sprite overlays for enchantments (e.g. Bubble) on the combat placeholder. */
export function EnchantmentSpriteOverlays(props: EnchantmentSpriteOverlaysProps) {
  const { stacks, spriteTriggerTarget } = props
  const poisonPulse = useEnchantmentSpriteTriggerPulse(spriteTriggerTarget ?? null, 'POISON')
  const nextPopIdRef = useRef(0)
  const prevCountsRef = useRef<Map<string, { count: number; sprite: EnchantmentSpriteOverlayId }>>(new Map())
  const [popsByKey, setPopsByKey] = useState<Map<string, ReadonlyArray<ActiveOverlayPop>>>(new Map())

  const popDurationMsFor = (sprite: EnchantmentSpriteOverlayId): number => {
    if (sprite === 'ANTI_MAGIC_SHELL') return antiMagicShellPopFxDurationMs() || 1500
    if (sprite === 'POISON') return poisonPopFxDurationMs() || 1500
    if (sprite === 'FIRE_CROWN') return fireCrownPopFxDurationMs() || 1500
    return bubblePopFxDurationMs() || 1500
  }

  useLayoutEffect(() => {
    const prev = prevCountsRef.current
    const next = new Map<string, { count: number; sprite: EnchantmentSpriteOverlayId }>()

    for (const stack of stacks) {
      const sprite = stack.render.sprite
      next.set(stack.key, { count: stack.count, sprite })
    }

    const newPops: Array<{ key: string; pop: ActiveOverlayPop }> = []

    for (const [key, old] of prev) {
      const newCount = next.get(key)?.count ?? 0
      const delta = Math.max(0, old.count - newCount)
      if (delta <= 0) continue
      for (let i = 0; i < delta; i++) {
        const id = ++nextPopIdRef.current
        newPops.push({ key, pop: { id, sprite: old.sprite } })
        const durationMs = popDurationMsFor(old.sprite)
        window.setTimeout(() => {
          setPopsByKey((current) => {
            const nextMap = new Map(current)
            const arr = nextMap.get(key) ?? []
            const filtered = arr.filter((p) => p.id !== id)
            if (filtered.length) nextMap.set(key, filtered)
            else nextMap.delete(key)
            return nextMap
          })
        }, durationMs + 80)
      }
    }

    if (newPops.length) {
      setPopsByKey((current) => {
        const nextMap = new Map(current)
        for (const { key, pop } of newPops) {
          const arr = nextMap.get(key) ?? []
          nextMap.set(key, [...arr, pop])
        }
        return nextMap
      })
    }

    prevCountsRef.current = next
  }, [stacks])

  const hasAny = stacks.some((s) => s.count > 0) || popsByKey.size > 0
  if (!hasAny) return null

  const currentByKey = new Map<string, { sprite: EnchantmentSpriteOverlayId; count: number }>()
  for (const stack of stacks) {
    currentByKey.set(stack.key, { sprite: stack.render.sprite, count: stack.count })
  }

  const overlayKeys = new Set<string>()
  for (const s of stacks) overlayKeys.add(s.key)
  for (const k of popsByKey.keys()) overlayKeys.add(k)

  return (
    <div className="enchantmentSpriteOverlays" aria-hidden>
      {Array.from(overlayKeys).map((key) => {
        const current = currentByKey.get(key)
        const pops = popsByKey.get(key) ?? []
        const showIdle = (current?.count ?? 0) > 0
        const showPop = pops.length > 0
        if (!showIdle && !showPop) return null

        // Prefer the current sprite; fall back to the last-pop sprite for recently removed stacks.
        const sprite = current?.sprite ?? pops[0]?.sprite
        if (!sprite) return null
        return (
          <div key={key} className={overlayClassName(sprite)} aria-hidden>
            {showIdle ? (
              <img
                key={sprite === 'POISON' ? `idle-poison-${poisonPulse.key}` : 'idle'}
                className={[
                  'enchantmentSpriteOverlay__idle',
                  sprite === 'POISON' ? poisonPulse.className : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
                src={enchantmentSpriteOverlaySrc(sprite, 'idle')}
                alt=""
                draggable={false}
              />
            ) : null}
            {showPop
              ? pops.map((p) => (
                  <img
                    key={`pop-${p.id}`}
                    className="enchantmentSpriteOverlay__pop"
                    src={enchantmentSpriteOverlaySrc(p.sprite, 'pop')}
                    alt=""
                    draggable={false}
                  />
                ))
              : null}
          </div>
        )
      })}
    </div>
  )
}
