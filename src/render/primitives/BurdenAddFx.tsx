import { useCallback, useRef } from 'react'
import type { GameAction } from '../../reducers/actions'
import type { BurdenAddEntry, GameState } from '../../core/types/state'
import { Cards } from '../../data/cards'
import { useSequentialCardsToDeckFx } from '../hooks/useSequentialCardsToDeckFx'
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
  const slot0Ref = useRef<HTMLDivElement | null>(null)
  const slot1Ref = useRef<HTMLDivElement | null>(null)
  const slotRefs = [slot0Ref, slot1Ref] as const

  const offers = queue.map((e) => ({ cardId: e.cardId, upgrades: e.upgrades }))
  const completedCount = 0

  const slotRefForIndex = useCallback((index: number) => slotRefs[index % 2]!, [slotRefs])

  const onApplied = useCallback(() => {
    dispatch({ type: 'COMBAT/COMPLETE_BURDEN_ADD' })
  }, [dispatch])

  const { isTraveling } = useSequentialCardsToDeckFx({
    offers,
    completedCount,
    active: queue.length > 0,
    cardKeyPrefix: 'burden-add-',
    slotRefForIndex,
    destination: queue[0]?.zone === 'discard' ? 'discard' : 'deck',
    onApplied,
    power: state.player.power,
    firepowerMultiplier: state.player.firepowerMultiplier,
    shieldPower: state.player.shieldPower,
  })

  if (queue.length === 0) return null

  return (
    <>
      {queue.slice(0, 2).map((entry: BurdenAddEntry, idx: number) => {
        const t = Cards[entry.cardId]
        const cardKey = `burden-add-${idx}`
        return (
          <div
            key={cardKey}
            ref={slotRefs[idx]}
            className={['collectorBulkCard', `collectorBulkCard--${idx}`].join(' ')}
          >
            <GameCardView
                template={t}
                offerUpgradeApplications={entry.upgrades}
                power={state.player.power}
                firepowerMultiplier={state.player.firepowerMultiplier}
                shieldPower={state.player.shieldPower}
                staticDisplay
                className={isTraveling(idx) ? 'gameCard--traveling' : undefined}
              />
          </div>
        )
      })}
    </>
  )
}
