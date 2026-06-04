import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameAction } from '../../reducers/actions'
import type { BurdenAddEntry, GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import { powerDisplayContextFromState } from '../../systems/combat/powerDisplay'
import {
  burdenAddSpawnOffsetForEntry,
  burdenAddStaggerMs,
  burdenAppearanceMs,
} from '../burdenAddFxConfig'
import { burdenAddEffectSprite } from '../assets/displayImages'
import { buildGameCardDisplayForOffer, toCardTravelPayload } from '../gameCardDisplay'
import { useCardTravel } from '../CardTravelContext'
import { GameCardView } from './GameCardView'

type BurdenAddFxProps = Readonly<{
  state: GameState
  dispatch: (action: GameAction) => void
}>

type SpawnLayout = Readonly<{
  offsetX: number
  offsetY: number
  stackOrder: number
}>

/** Per-entry preview + travel FX; burdens overlap and do not wait on each other. */
export function BurdenAddFx(props: BurdenAddFxProps) {
  const { state, dispatch } = props
  const combat = state.combat
  const queue = combat?.burdenAddQueue ?? []
  const slotElByIdRef = useRef(new Map<string, HTMLDivElement>())

  const { travelCardToDeck, travelCardToDiscard, travelingCardKeys } = useCardTravel()
  const powerDisplay = powerDisplayContextFromState(state)

  const scheduledRef = useRef(new Set<string>())
  const travelStartedRef = useRef(new Set<string>())
  const spawnLayoutRef = useRef(new Map<string, SpawnLayout>())
  const timersRef = useRef(new Map<string, ReadonlyArray<number>>())
  const [spawnedIds, setSpawnedIds] = useState<ReadonlySet<string>>(() => new Set())

  const clearEntryTimers = useCallback((entryId: string) => {
    const ids = timersRef.current.get(entryId)
    if (ids) {
      for (const id of ids) window.clearTimeout(id)
      timersRef.current.delete(entryId)
    }
  }, [])

  const clearAllTimers = useCallback(() => {
    for (const entryId of timersRef.current.keys()) clearEntryTimers(entryId)
  }, [clearEntryTimers])

  const startTravelForEntry = useCallback(
    (entry: BurdenAddEntry) => {
      if (travelStartedRef.current.has(entry.id)) return

      const tryStart = (attempt = 0) => {
        const slotEl = slotElByIdRef.current.get(entry.id)
        if (!slotEl) {
          if (attempt < 120) requestAnimationFrame(() => tryStart(attempt + 1))
          return
        }

        travelStartedRef.current.add(entry.id)

        const tmpl = Cards[entry.cardId]
        const cardKey = `burden-add-${entry.id}`

        const payload = {
          cardKey,
          sourceEl: slotEl,
          travelProfile: 'burden' as const,
          card: tmpl
            ? toCardTravelPayload(
                buildGameCardDisplayForOffer(tmpl, entry.upgrades, powerDisplay, false, state.level),
              )
            : {
                cardId: entry.cardId,
                name: entry.cardId,
                inkLabel: null,
                descriptionLines: [],
              },
          onComplete: () => {
            clearEntryTimers(entry.id)
            travelStartedRef.current.delete(entry.id)
            scheduledRef.current.delete(entry.id)
            spawnLayoutRef.current.delete(entry.id)
            setSpawnedIds((prev) => {
              const next = new Set(prev)
              next.delete(entry.id)
              return next
            })
            dispatch({ type: 'COMBAT/COMPLETE_BURDEN_ADD', id: entry.id })
          },
        } as const

        if (entry.zone === 'discard') travelCardToDiscard(payload)
        else travelCardToDeck(payload)
      }

      tryStart()
    },
    [
      clearEntryTimers,
      dispatch,
      powerDisplay,
      state.level,
      travelCardToDeck,
      travelCardToDiscard,
    ],
  )

  useEffect(() => {
    if (queue.length === 0) {
      clearAllTimers()
      scheduledRef.current.clear()
      travelStartedRef.current.clear()
      spawnLayoutRef.current.clear()
      setSpawnedIds(new Set())
      return
    }

    const queueIds = new Set(queue.map((e) => e.id))
    for (const id of [...scheduledRef.current]) {
      if (!queueIds.has(id)) {
        scheduledRef.current.delete(id)
        travelStartedRef.current.delete(id)
        spawnLayoutRef.current.delete(id)
        clearEntryTimers(id)
      }
    }

    const staggerMs = burdenAddStaggerMs()
    const appearanceMs = burdenAppearanceMs()

    for (const [orderIndex, entry] of queue.entries()) {
      if (scheduledRef.current.has(entry.id)) continue
      scheduledRef.current.add(entry.id)

      const offset = burdenAddSpawnOffsetForEntry(entry.id, orderIndex)
      spawnLayoutRef.current.set(entry.id, {
        offsetX: offset.x,
        offsetY: offset.y,
        stackOrder: orderIndex,
      })

      const entryTimers: number[] = []
      const registerTimer = (timerId: number) => {
        entryTimers.push(timerId)
        timersRef.current.set(entry.id, [...entryTimers])
      }

      const spawnDelayMs = orderIndex * staggerMs
      const spawnTimer = window.setTimeout(() => {
        setSpawnedIds((prev) => new Set(prev).add(entry.id))
        const travelTimer = window.setTimeout(() => {
          startTravelForEntry(entry)
        }, appearanceMs)
        registerTimer(travelTimer)
      }, spawnDelayMs)
      registerTimer(spawnTimer)
    }
  }, [clearAllTimers, queue, startTravelForEntry])

  useEffect(
    () => () => {
      clearAllTimers()
      scheduledRef.current.clear()
      travelStartedRef.current.clear()
      spawnLayoutRef.current.clear()
    },
    [clearAllTimers],
  )

  if (queue.length === 0) return null

  return (
    <>
      {queue
        .filter((entry) => spawnedIds.has(entry.id))
        .map((entry) => {
          const t = Cards[entry.cardId]
          const display = t
            ? buildGameCardDisplayForOffer(t, entry.upgrades, powerDisplay, false, state.level)
            : null
          const cardKey = `burden-add-${entry.id}`
          const traveling = travelingCardKeys.has(cardKey)
          const layout = spawnLayoutRef.current.get(entry.id)
          const stackOrder = layout?.stackOrder ?? 0
          return (
            <div
              key={cardKey}
              ref={(el) => {
                if (el) slotElByIdRef.current.set(entry.id, el)
                else slotElByIdRef.current.delete(entry.id)
              }}
              className={['burdenAddCard', traveling ? 'burdenAddCard--traveling' : null]
                .filter(Boolean)
                .join(' ')}
              style={{
                ['--burden-add-offset-x' as string]: `${layout?.offsetX ?? 0}px`,
                ['--burden-add-offset-y' as string]: `${layout?.offsetY ?? 0}px`,
                zIndex: `calc(var(--burden-add-card-z-index) + ${stackOrder})`,
              }}
            >
              <img
                className="burdenAddCard__glow"
                src={burdenAddEffectSprite}
                alt=""
                draggable={false}
                aria-hidden
              />
              <div className="burdenAddCard__cardWrap">
                <GameCardView
                  display={display ?? undefined}
                  className={traveling ? 'gameCard--traveling' : undefined}
                />
              </div>
            </div>
          )
        })}
    </>
  )
}
