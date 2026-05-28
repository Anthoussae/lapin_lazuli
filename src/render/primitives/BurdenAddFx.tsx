import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GameAction } from '../../reducers/actions'
import type { BurdenAddEntry, GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import { effectiveShieldPower } from '../../systems/combat/combatBonuses'
import { collectorBulkPreviewHoldMs } from '../collectorBulkConfig'
import { useCardTravel } from '../CardTravelContext'
import { cardDescriptionLinesForOffer, formatCardName } from '../../ui/describe'
import { GameCardView } from './GameCardView'

type BurdenAddFxProps = Readonly<{
  state: GameState
  dispatch: (action: GameAction) => void
}>

/** Collector-style preview + travel FX for queued burden cards (combat). */
export function BurdenAddFx(props: BurdenAddFxProps) {
  const { state, dispatch } = props
  const combat = state.combat
  const queue = combat?.burdenAddQueue ?? []
  const openingBurdenAdds = combat?.pendingOpeningHandDraw != null
  const slotElByIdRef = useRef(new Map<string, HTMLDivElement>())

  const { travelCardToDeck, travelCardToDiscard, travelingCardKeys } = useCardTravel()
  const power = state.player.power
  const firepower = state.player.firepower
  const firepowerMultiplier = state.player.firepowerMultiplier
  const shieldPower = effectiveShieldPower(state)

  const active = queue.length > 0 && !openingBurdenAdds
  const visible = useMemo(() => queue.slice(0, 2), [queue])
  const [previewReady, setPreviewReady] = useState(false)
  const previewStartedRef = useRef(false)
  const startedRef = useRef(new Set<string>())
  const inFlightRef = useRef(new Set<string>())

  useEffect(() => {
    if (!active || visible.length === 0) {
      previewStartedRef.current = false
      startedRef.current.clear()
      setPreviewReady(false)
      return
    }
    if (previewStartedRef.current) return
    previewStartedRef.current = true
    setPreviewReady(false)
    const holdMs = collectorBulkPreviewHoldMs()
    const t = window.setTimeout(() => setPreviewReady(true), holdMs)
    return () => window.clearTimeout(t)
  }, [active, visible.length])

  useLayoutEffect(() => {
    if (!active || !previewReady || visible.length === 0) return

    visible.forEach((entry, idx) => {
      if (startedRef.current.has(entry.id)) return

      const slotEl = slotElByIdRef.current.get(entry.id)
      if (!slotEl) return

      startedRef.current.add(entry.id)
      inFlightRef.current.add(entry.id)

      const tmpl = Cards[entry.cardId]
      const label = tmpl ? formatCardName(tmpl.name, entry.upgrades) : entry.cardId
      const cardKey = `burden-add-${entry.id}`

      const start = () => {
        const payload = {
          cardKey,
          sourceEl: slotEl,
          card: {
            cardId: entry.cardId,
            name: label,
            nameUpgraded: entry.upgrades > 0,
            inkLabel: tmpl?.cost !== null && tmpl?.cost !== undefined ? String(tmpl.cost) : null,
            descriptionLines: tmpl
              ? cardDescriptionLinesForOffer(
                  tmpl,
                  entry.upgrades,
                  power,
                  firepower,
                  firepowerMultiplier,
                  shieldPower,
                  false,
                  state.player.relics.some((r) => r.templateId === 'GREEN_HAT'),
                )
              : [],
          },
          onComplete: () => {
            inFlightRef.current.delete(entry.id)
            if (inFlightRef.current.size === 0) {
              previewStartedRef.current = false
              startedRef.current.clear()
              setPreviewReady(false)
            }
            dispatch({ type: 'COMBAT/COMPLETE_BURDEN_ADD', id: entry.id })
          },
        } as const

        if (entry.zone === 'discard') travelCardToDiscard(payload)
        else travelCardToDeck(payload)
      }

      // If multiple burdens are visible, start in parallel with a tiny stagger.
      const delayMs = idx * 50
      if (delayMs === 0) start()
      else window.setTimeout(start, delayMs)
    })
  }, [
    active,
    dispatch,
    firepower,
    firepowerMultiplier,
    power,
    previewReady,
    shieldPower,
    travelCardToDeck,
    travelCardToDiscard,
    visible,
  ])

  const openingTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  useEffect(() => {
    if (!openingBurdenAdds || queue.length === 0) {
      if (openingTimerRef.current != null) window.clearTimeout(openingTimerRef.current)
      openingTimerRef.current = null
      return
    }
    if (openingTimerRef.current != null) return
    const holdMs = collectorBulkPreviewHoldMs()
    openingTimerRef.current = window.setTimeout(() => {
      openingTimerRef.current = null
      dispatch({ type: 'COMBAT/COMPLETE_BURDEN_ADD' })
    }, holdMs + 120)
    return () => {
      if (openingTimerRef.current != null) window.clearTimeout(openingTimerRef.current)
      openingTimerRef.current = null
    }
  }, [dispatch, openingBurdenAdds, queue.length])

  if (queue.length === 0) return null

  return (
    <>
      {visible.map((entry: BurdenAddEntry, idx: number) => {
        const t = Cards[entry.cardId]
        const cardKey = `burden-add-${entry.id}`
        const traveling = travelingCardKeys.has(cardKey)
        return (
          <div
            key={cardKey}
            ref={(el) => {
              if (el) slotElByIdRef.current.set(entry.id, el)
              else slotElByIdRef.current.delete(entry.id)
            }}
            className={['collectorBulkCard', `collectorBulkCard--${idx}`].join(' ')}
          >
            <GameCardView
                template={t}
                offerUpgradeApplications={entry.upgrades}
                power={power}
                firepower={firepower}
                firepowerMultiplier={firepowerMultiplier}
                shieldPower={shieldPower}
                hasGreenHat={state.player.relics.some((r) => r.templateId === 'GREEN_HAT')}
                staticDisplay
                className={!openingBurdenAdds && traveling ? 'gameCard--traveling' : undefined}
              />
          </div>
        )
      })}
    </>
  )
}
