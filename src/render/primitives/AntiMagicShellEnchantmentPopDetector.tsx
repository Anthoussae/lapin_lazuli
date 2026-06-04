import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import type { EnchantmentRender } from '../../core/types/enchantments'
import { useAntiMagicShellPopFxOptional } from '../AntiMagicShellPopFxContext'
import type { EnchantmentSpriteOverlayStack } from './EnchantmentSpriteOverlays'

type AntiMagicShellEnchantmentPopDetectorProps = Readonly<{
  stacks: ReadonlyArray<EnchantmentSpriteOverlayStack>
  anchorRef: RefObject<HTMLElement | null>
}>

/** Watches Anti-Magic Shell stack count; plays stage-layer pop FX when stacks decrease (including to zero). */
export function AntiMagicShellEnchantmentPopDetector(props: AntiMagicShellEnchantmentPopDetectorProps) {
  const { stacks, anchorRef } = props
  const antiMagicShellPopFx = useAntiMagicShellPopFxOptional()
  const prevStacksRef = useRef<Map<string, { count: number; render: EnchantmentRender }>>(new Map())
  const pendingRafRef = useRef<number | null>(null)

  const triggerPops = (popsNeeded: number, attempt: number) => {
    if (!antiMagicShellPopFx) return
    const anchor = anchorRef.current
    if (!anchor) {
      if (attempt <= 3) {
        if (pendingRafRef.current != null) window.cancelAnimationFrame(pendingRafRef.current)
        pendingRafRef.current = window.requestAnimationFrame(() => triggerPops(popsNeeded, attempt + 1))
        console.log('[anti-magic-shell-pop] anchorRef.current null; retrying next frame', { popsNeeded, attempt })
      } else {
        console.log('[anti-magic-shell-pop] anchorRef.current still null; giving up', { popsNeeded, attempt })
      }
      return
    }

    for (let i = 0; i < popsNeeded; i++) {
      console.log('[anti-magic-shell-pop] detector trigger playAntiMagicShellPopAt', { i: i + 1, of: popsNeeded, attempt })
      antiMagicShellPopFx.playAntiMagicShellPopAt(anchor)
    }
  }

  useEffect(() => {
    console.log('[anti-magic-shell-pop] detector mounted', {
      hasFx: Boolean(antiMagicShellPopFx),
      hasAnchor: Boolean(anchorRef.current),
    })
    return () => {
      if (pendingRafRef.current != null) window.cancelAnimationFrame(pendingRafRef.current)
      pendingRafRef.current = null
      console.log('[anti-magic-shell-pop] detector unmounted')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    const prev = prevStacksRef.current
    const next = new Map<string, { count: number; render: EnchantmentRender }>()
    for (const stack of stacks) {
      next.set(stack.key, { count: stack.count, render: stack.render })
    }

    let popsNeeded = 0
    for (const [key, old] of prev) {
      const newCount = next.get(key)?.count ?? 0
      popsNeeded += Math.max(0, old.count - newCount)
    }

    if (popsNeeded > 0 || stacks.length > 0 || prev.size > 0) {
      console.log('[anti-magic-shell-pop] detector compute', {
        stacks: stacks.map((s) => ({ key: s.key, count: s.count, sprite: s.render.sprite })),
        prevKeys: Array.from(prev.keys()),
        popsNeeded,
        hasFx: Boolean(antiMagicShellPopFx),
        hasAnchor: Boolean(anchorRef.current),
      })
    }

    if (popsNeeded > 0 && antiMagicShellPopFx) {
      triggerPops(popsNeeded, 0)
    } else if (popsNeeded > 0 && !antiMagicShellPopFx) {
      console.log('[anti-magic-shell-pop] detector wanted pops but no AntiMagicShellPopFxContext (provider missing?)', { popsNeeded })
    }

    prevStacksRef.current = next
  }, [stacks, anchorRef, antiMagicShellPopFx])

  return null
}

