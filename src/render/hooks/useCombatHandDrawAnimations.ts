import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CardInstance, GameState } from '../../core/types/state'
import type { CardInstanceId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import type { PowerDisplayContext } from '../../systems/combat/powerDisplay'
import { buildGameCardDisplayForInstance, toCardTravelPayload } from '../gameCardDisplay'
import { cardViewportRect } from '../cardLayout'
import { useCardConsume } from '../CardConsumeContext'
import { useCardTravel } from '../CardTravelContext'

type UseCombatHandDrawAnimationsArgs = Readonly<{
  handIds: ReadonlyArray<CardInstanceId>
  discardPileIds: ReadonlyArray<CardInstanceId>
  cardById: GameState['player']['deck']['cardById']
  powerDisplay: PowerDisplayContext
  gameLevel: number
  freeFirstFireSpell: boolean
  nextSpellCosts0: boolean
  enabled: boolean
  pendingTurnStartDraw: boolean
  burdenAddsBlocking: boolean
  onCompleteTurnStartDraw: () => void
}>

function cardTravelPayload(
  cardInstanceId: CardInstanceId,
  inst: CardInstance | undefined,
  powerDisplay: PowerDisplayContext,
  gameLevel: number,
  freeFirstFireSpell: boolean,
  nextSpellCosts0: boolean,
) {
  const template = inst ? Cards[inst.templateId] : undefined
  if (!inst || !template) {
    return {
      cardId: inst?.templateId,
      name: inst?.templateId ?? cardInstanceId,
      inkLabel: null,
      descriptionLines: [] as const,
    }
  }
  return toCardTravelPayload(
    buildGameCardDisplayForInstance(template, inst, powerDisplay, gameLevel, {
      freeFirstFireSpell,
      nextSpellCosts0,
    }),
  )
}

function wasDiscardedFromHand(
  cardInstanceId: CardInstanceId,
  cardById: GameState['player']['deck']['cardById'],
  discardPileIds: ReadonlyArray<CardInstanceId>,
): boolean {
  return !!cardById[cardInstanceId] && discardPileIds.includes(cardInstanceId)
}

function wasConsumedFromHand(
  cardInstanceId: CardInstanceId,
  cardById: GameState['player']['deck']['cardById'],
  discardPileIds: ReadonlyArray<CardInstanceId>,
): boolean {
  if (cardById[cardInstanceId]) return false
  if (discardPileIds.includes(cardInstanceId)) return false
  return true
}

function buildVisualHandIds(
  prevHand: ReadonlyArray<CardInstanceId>,
  handIds: ReadonlyArray<CardInstanceId>,
  pendingDiscardIds: ReadonlyArray<CardInstanceId>,
  pendingConsumeIds: ReadonlyArray<CardInstanceId>,
): CardInstanceId[] {
  const pending = new Set([...pendingDiscardIds, ...pendingConsumeIds])
  const visual = prevHand.filter((id) => handIds.includes(id) || pending.has(id))
  for (const id of handIds) {
    if (!visual.includes(id)) visual.push(id)
  }
  return visual
}

export function useCombatHandDrawAnimations(args: UseCombatHandDrawAnimationsArgs) {
  const {
    handIds,
    discardPileIds,
    cardById,
    powerDisplay,
    gameLevel,
    freeFirstFireSpell,
    nextSpellCosts0,
    enabled,
    pendingTurnStartDraw,
    burdenAddsBlocking,
    onCompleteTurnStartDraw,
  } = args
  const { travelCardFromDeck, travelCardToDiscard, travelingCardKey, travelingDiscardCardKeys } =
    useCardTravel()
  const { playCardConsume } = useCardConsume()

  // Start empty so the opening hand (already in state when combat mounts) still animates.
  const prevHandRef = useRef<ReadonlyArray<CardInstanceId>>([])
  const drawQueueRef = useRef<CardInstanceId[]>([])
  const discardQueueRef = useRef<CardInstanceId[]>([])
  const consumeQueueRef = useRef<CardInstanceId[]>([])
  const discardInFlightRef = useRef(new Set<CardInstanceId>())
  const consumeInFlightRef = useRef(new Set<CardInstanceId>())
  const processingRef = useRef(false)
  const slotRefs = useRef(new Map<CardInstanceId, HTMLElement>())
  const slotRectsRef = useRef(new Map<CardInstanceId, DOMRect>())
  const [visualHandIds, setVisualHandIds] = useState<ReadonlyArray<CardInstanceId>>(handIds)
  const [, bump] = useState(0)

  const registerHandSlot = useCallback((cardInstanceId: CardInstanceId, el: HTMLElement | null) => {
    if (el) {
      slotRefs.current.set(cardInstanceId, el)
      slotRectsRef.current.set(cardInstanceId, cardViewportRect(el))
    } else {
      const prevEl = slotRefs.current.get(cardInstanceId)
      if (prevEl) slotRectsRef.current.set(cardInstanceId, cardViewportRect(prevEl))
      slotRefs.current.delete(cardInstanceId)
    }
  }, [])

  const clearDiscardSlotCache = useCallback((cardInstanceId: CardInstanceId) => {
    slotRectsRef.current.delete(cardInstanceId)
  }, [])

  const processQueuesRef = useRef<() => void>(() => {})

  const hasPendingDiscardWork = useCallback(() => {
    return discardQueueRef.current.length > 0 || discardInFlightRef.current.size > 0
  }, [])

  const hasPendingConsumeWork = useCallback(() => {
    return consumeQueueRef.current.length > 0 || consumeInFlightRef.current.size > 0
  }, [])

  const processDrawQueue = useCallback(() => {
    if (!enabled || burdenAddsBlocking || processingRef.current || travelingCardKey || hasPendingDiscardWork() || hasPendingConsumeWork())
      return
    if (drawQueueRef.current.length === 0) return

    const nextId = drawQueueRef.current[0]
    const destEl = slotRefs.current.get(nextId)
    if (!destEl) {
      requestAnimationFrame(() => processDrawQueue())
      return
    }

    const inst = cardById[nextId]
    processingRef.current = true

    travelCardFromDeck({
      cardKey: nextId,
      destEl,
      card: cardTravelPayload(nextId, inst, powerDisplay, gameLevel, freeFirstFireSpell, nextSpellCosts0),
      onComplete: () => {
        drawQueueRef.current.shift()
        processingRef.current = false
        bump((n) => n + 1)
        processQueuesRef.current()
      },
    })
  }, [
    burdenAddsBlocking,
    cardById,
    enabled,
    freeFirstFireSpell,
    gameLevel,
    hasPendingConsumeWork,
    hasPendingDiscardWork,
    nextSpellCosts0,
    powerDisplay,
    travelCardFromDeck,
    travelingCardKey,
  ])

  const processPendingConsumes = useCallback(() => {
    if (!enabled) return

    let waitingForSlot = false
    for (const nextId of consumeQueueRef.current) {
      if (consumeInFlightRef.current.has(nextId)) continue

      const sourceEl = slotRefs.current.get(nextId) ?? null
      const sourceRect = slotRectsRef.current.get(nextId)
      if (!sourceEl && !sourceRect) {
        waitingForSlot = true
        continue
      }

      consumeInFlightRef.current.add(nextId)

      playCardConsume({
        cardInstanceId: nextId,
        sourceEl: sourceEl ?? undefined,
        sourceRect: sourceEl ? undefined : sourceRect,
        hostClassName: 'cardConsumeHost--combat',
        onComplete: () => {
          consumeInFlightRef.current.delete(nextId)
          consumeQueueRef.current = consumeQueueRef.current.filter((id) => id !== nextId)
          slotRectsRef.current.delete(nextId)
          bump((n) => n + 1)
          processQueuesRef.current()
        },
      })
    }

    if (waitingForSlot) requestAnimationFrame(() => processPendingConsumes())
  }, [enabled, playCardConsume])

  const processPendingDiscards = useCallback(() => {
    if (!enabled) return

    let waitingForSlot = false
    for (const nextId of discardQueueRef.current) {
      if (discardInFlightRef.current.has(nextId)) continue

      const sourceEl = slotRefs.current.get(nextId) ?? null
      const sourceRect = slotRectsRef.current.get(nextId)
      if (!sourceEl && !sourceRect) {
        waitingForSlot = true
        continue
      }

      const inst = cardById[nextId]
      discardInFlightRef.current.add(nextId)

      travelCardToDiscard({
        cardKey: nextId,
        sourceEl: sourceEl ?? undefined,
        sourceRect: sourceEl ? undefined : sourceRect,
        card: cardTravelPayload(nextId, inst, powerDisplay, gameLevel, freeFirstFireSpell, nextSpellCosts0),
        onComplete: () => {
          discardInFlightRef.current.delete(nextId)
          discardQueueRef.current = discardQueueRef.current.filter((id) => id !== nextId)
          clearDiscardSlotCache(nextId)
          bump((n) => n + 1)
          processQueuesRef.current()
        },
      })
    }

    if (waitingForSlot) requestAnimationFrame(() => processPendingDiscards())
  }, [
    cardById,
    clearDiscardSlotCache,
    enabled,
    gameLevel,
    freeFirstFireSpell,
    nextSpellCosts0,
    powerDisplay,
    travelCardToDiscard,
  ])

  const tryCompleteTurnStartDraw = useCallback(() => {
    if (!pendingTurnStartDraw) return
    if (burdenAddsBlocking) return
    if (processingRef.current || travelingCardKey) return
    if (hasPendingDiscardWork()) return
    if (hasPendingConsumeWork()) return
    onCompleteTurnStartDraw()
  }, [
    burdenAddsBlocking,
    hasPendingConsumeWork,
    hasPendingDiscardWork,
    onCompleteTurnStartDraw,
    pendingTurnStartDraw,
    travelingCardKey,
  ])

  const processQueues = useCallback(() => {
    if (!enabled) return
    if (hasPendingDiscardWork()) {
      processPendingDiscards()
      return
    }
    if (hasPendingConsumeWork()) {
      processPendingConsumes()
      return
    }
    if (processingRef.current || travelingCardKey) return
    if (drawQueueRef.current.length > 0) {
      processDrawQueue()
      return
    }
    tryCompleteTurnStartDraw()
  }, [
    enabled,
    hasPendingConsumeWork,
    hasPendingDiscardWork,
    processDrawQueue,
    processPendingConsumes,
    processPendingDiscards,
    travelingCardKey,
    tryCompleteTurnStartDraw,
  ])

  processQueuesRef.current = processQueues

  useLayoutEffect(() => {
    const prev = prevHandRef.current
    const added = handIds.filter((id) => !prev.includes(id))
    const removed = prev.filter((id) => !handIds.includes(id))
    prevHandRef.current = handIds

    drawQueueRef.current = drawQueueRef.current.filter((id) => handIds.includes(id))
    for (const id of added) {
      if (!drawQueueRef.current.includes(id)) drawQueueRef.current.push(id)
    }

    discardQueueRef.current = discardQueueRef.current.filter((id) => !handIds.includes(id))
    consumeQueueRef.current = consumeQueueRef.current.filter((id) => !handIds.includes(id))
    for (const id of removed) {
      if (wasDiscardedFromHand(id, cardById, discardPileIds)) {
        if (!discardQueueRef.current.includes(id)) discardQueueRef.current.push(id)
        continue
      }
      if (wasConsumedFromHand(id, cardById, discardPileIds)) {
        const hasAnchor = slotRefs.current.has(id) || slotRectsRef.current.has(id)
        if (!hasAnchor) continue
        if (!consumeQueueRef.current.includes(id)) consumeQueueRef.current.push(id)
      }
    }

    setVisualHandIds(
      buildVisualHandIds(prev, handIds, discardQueueRef.current, consumeQueueRef.current),
    )

    if (added.length || removed.length) bump((n) => n + 1)
  }, [cardById, discardPileIds, handIds])

  useLayoutEffect(() => {
    setVisualHandIds(
      buildVisualHandIds(
        prevHandRef.current,
        handIds,
        discardQueueRef.current,
        consumeQueueRef.current,
      ),
    )
  }, [handIds, travelingDiscardCardKeys])

  useLayoutEffect(() => {
    if (!enabled) return
    processQueues()
  }, [
    enabled,
    handIds,
    discardPileIds,
    pendingTurnStartDraw,
    processQueues,
    travelingCardKey,
    travelingDiscardCardKeys,
  ])

  const isHandCardHidden = useCallback(
    (cardInstanceId: CardInstanceId) => {
      if (travelingCardKey === cardInstanceId) return true
      if (travelingDiscardCardKeys.has(cardInstanceId)) return true
      if (consumeInFlightRef.current.has(cardInstanceId)) return true
      if (consumeQueueRef.current.includes(cardInstanceId)) return true
      const drawIndex = drawQueueRef.current.indexOf(cardInstanceId)
      return drawIndex >= 0
    },
    [travelingCardKey, travelingDiscardCardKeys],
  )

  const getHandSlotEl = useCallback(
    (cardInstanceId: CardInstanceId) => slotRefs.current.get(cardInstanceId) ?? null,
    [],
  )

  return { registerHandSlot, isHandCardHidden, getHandSlotEl, visualHandIds }
}
