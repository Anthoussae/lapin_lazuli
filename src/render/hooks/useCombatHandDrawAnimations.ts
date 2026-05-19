import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CardInstance, GameState } from '../../core/types/state'
import type { CardInstanceId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { cardDescriptionLinesForInstance, formatCardInstanceDisplayName } from '../../ui/describe'
import { cardInstanceInkCost } from '../../systems/cards/inkCost'
import { useCardTravel } from '../CardTravelContext'

type UseCombatHandDrawAnimationsArgs = Readonly<{
  handIds: ReadonlyArray<CardInstanceId>
  cardById: GameState['player']['deck']['cardById']
  power: number
  firepowerMultiplier: number
  enabled: boolean
}>

function cardTravelPayload(
  cardInstanceId: CardInstanceId,
  inst: CardInstance | undefined,
  power: number,
  firepowerMultiplier: number,
) {
  const template = inst ? Cards[inst.templateId] : undefined
  const ink = inst && template ? cardInstanceInkCost(inst, template) : null
  return {
    name:
      inst && template
        ? formatCardInstanceDisplayName(template, inst)
        : inst?.templateId ?? cardInstanceId,
    nameUpgraded: (inst?.upgrades ?? 0) > 0,
    inkLabel: inst?.exhausted ? 'Exhausted' : ink !== null ? String(ink) : null,
    descriptionLines:
      inst && template ? cardDescriptionLinesForInstance(template, inst, power, firepowerMultiplier) : [],
  }
}

export function useCombatHandDrawAnimations(args: UseCombatHandDrawAnimationsArgs) {
  const { handIds, cardById, power, firepowerMultiplier, enabled } = args
  const { travelCardFromDeck, travelingCardKey } = useCardTravel()

  // Start empty so the opening hand (already in state when combat mounts) still animates.
  const prevHandRef = useRef<ReadonlyArray<CardInstanceId>>([])
  const queueRef = useRef<CardInstanceId[]>([])
  const processingRef = useRef(false)
  const slotRefs = useRef(new Map<CardInstanceId, HTMLElement>())
  const [, bump] = useState(0)

  const registerHandSlot = useCallback((cardInstanceId: CardInstanceId, el: HTMLElement | null) => {
    if (el) slotRefs.current.set(cardInstanceId, el)
    else slotRefs.current.delete(cardInstanceId)
  }, [])

  const processQueue = useCallback(() => {
    if (!enabled || processingRef.current || travelingCardKey || queueRef.current.length === 0) return

    const nextId = queueRef.current[0]
    const destEl = slotRefs.current.get(nextId)
    if (!destEl) {
      requestAnimationFrame(() => processQueue())
      return
    }

    const inst = cardById[nextId]
    processingRef.current = true

    travelCardFromDeck({
      cardKey: nextId,
      destEl,
      card: cardTravelPayload(nextId, inst, power, firepowerMultiplier),
      onComplete: () => {
        queueRef.current.shift()
        processingRef.current = false
        bump((n) => n + 1)
        processQueue()
      },
    })
  }, [cardById, enabled, firepowerMultiplier, power, travelCardFromDeck, travelingCardKey])

  useLayoutEffect(() => {
    const prev = prevHandRef.current
    const added = handIds.filter((id) => !prev.includes(id))
    prevHandRef.current = handIds

    queueRef.current = queueRef.current.filter((id) => handIds.includes(id))
    for (const id of added) {
      if (!queueRef.current.includes(id)) queueRef.current.push(id)
    }

    if (added.length) bump((n) => n + 1)
  }, [handIds])

  useLayoutEffect(() => {
    if (!enabled) return
    processQueue()
  }, [enabled, handIds, processQueue, travelingCardKey])

  const isHandCardHidden = useCallback(
    (cardInstanceId: CardInstanceId) => {
      if (travelingCardKey === cardInstanceId) return true
      const queueIndex = queueRef.current.indexOf(cardInstanceId)
      return queueIndex >= 0
    },
    [travelingCardKey],
  )

  const getHandSlotEl = useCallback(
    (cardInstanceId: CardInstanceId) => slotRefs.current.get(cardInstanceId) ?? null,
    [],
  )

  return { registerHandSlot, isHandCardHidden, getHandSlotEl }
}
