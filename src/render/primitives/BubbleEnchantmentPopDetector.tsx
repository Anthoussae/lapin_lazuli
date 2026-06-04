import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import type { EnchantmentRender } from '../../core/types/enchantments'
import { useBubblePopFxOptional } from '../BubblePopFxContext'
import type { EnchantmentSpriteOverlayStack } from './EnchantmentSpriteOverlays'

type BubbleEnchantmentPopDetectorProps = Readonly<{
  stacks: ReadonlyArray<EnchantmentSpriteOverlayStack>
  anchorRef: RefObject<HTMLElement | null>
}>

/** Watches bubble stack count; plays stage-layer pop FX when stacks decrease (including to zero). */
export function BubbleEnchantmentPopDetector(props: BubbleEnchantmentPopDetectorProps) {
  const { stacks, anchorRef } = props
  const bubblePopFx = useBubblePopFxOptional()
  const prevStacksRef = useRef<Map<string, { count: number; render: EnchantmentRender }>>(new Map())
  const pendingRafRef = useRef<number | null>(null)

  const bubbleStacks = stacks.filter((s) => s.render.sprite === 'BUBBLE')

  const triggerPops = (popsNeeded: number, attempt: number) => {
    if (!bubblePopFx) return
    const anchor = anchorRef.current
    if (!anchor) {
      if (attempt <= 3) {
        if (pendingRafRef.current != null) window.cancelAnimationFrame(pendingRafRef.current)
        pendingRafRef.current = window.requestAnimationFrame(() => triggerPops(popsNeeded, attempt + 1))
        console.log('[bubble-pop] anchorRef.current null; retrying next frame', { popsNeeded, attempt })
      } else {
        console.log('[bubble-pop] anchorRef.current still null; giving up', { popsNeeded, attempt })
      }
      return
    }

    for (let i = 0; i < popsNeeded; i++) {
      console.log('[bubble-pop] detector trigger playBubblePopAt', { i: i + 1, of: popsNeeded, attempt })
      bubblePopFx.playBubblePopAt(anchor)
    }
  }

  useEffect(() => {
    console.log('[bubble-pop] detector mounted', {
      hasFx: Boolean(bubblePopFx),
      hasAnchor: Boolean(anchorRef.current),
    })
    return () => {
      if (pendingRafRef.current != null) window.cancelAnimationFrame(pendingRafRef.current)
      pendingRafRef.current = null
      console.log('[bubble-pop] detector unmounted')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    const prev = prevStacksRef.current
    const next = new Map<string, { count: number; render: EnchantmentRender }>()
    for (const stack of bubbleStacks) {
      next.set(stack.key, { count: stack.count, render: stack.render })
    }

    let popsNeeded = 0
    for (const [key, old] of prev) {
      const newCount = next.get(key)?.count ?? 0
      popsNeeded += Math.max(0, old.count - newCount)
    }

    // Only log when something interesting happens; avoids console flood.
    if (popsNeeded > 0 || bubbleStacks.length > 0 || prev.size > 0) {
      console.log('[bubble-pop] detector compute', {
        stacks: bubbleStacks.map((s) => ({ key: s.key, count: s.count, sprite: s.render.sprite })),
        prevKeys: Array.from(prev.keys()),
        popsNeeded,
        hasFx: Boolean(bubblePopFx),
        hasAnchor: Boolean(anchorRef.current),
      })
    }

    if (popsNeeded > 0 && bubblePopFx) {
      triggerPops(popsNeeded, 0)
    } else if (popsNeeded > 0 && !bubblePopFx) {
      console.log('[bubble-pop] detector wanted pops but no BubblePopFxContext (provider missing?)', { popsNeeded })
    }

    prevStacksRef.current = next
  }, [bubbleStacks, anchorRef, bubblePopFx])

  return null
}
