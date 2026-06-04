import { useEffect, useRef } from 'react'
import { Cards } from '../../data/cards'
import type { CardInstance } from '../../core/types/state'
import type { ScreenProps } from '../screens/types'
import { useCardConsume } from '../CardConsumeContext'
import { fontOfLetheForgetConsumeDelayMs, fontOfLetheForgetPoofViewportPoint } from '../fontOfLetheForgetFxConfig'
import { powerDisplayContextFromPlayer } from '../../systems/combat/powerDisplay'
import { GameCardView } from './GameCardView'

function deckCardsSorted(instances: ReadonlyArray<CardInstance>): ReadonlyArray<CardInstance> {
  return [...instances].sort((a, b) => {
    const na = Cards[a.templateId]?.name ?? a.templateId
    const nb = Cards[b.templateId]?.name ?? b.templateId
    return na.localeCompare(nb)
  })
}

export function FontOfLetheForgetDialog(props: Readonly<{ state: ScreenProps['state']; enqueue: ScreenProps['enqueue'] }>) {
  const { state, enqueue } = props
  const fol = state.mysteryRoom?.fontOfLethe
  const selectedId = fol?.selectedCardInstanceId ?? null
  const canForget = selectedId != null
  const { playCardConsume } = useCardConsume()
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const pendingConsumeRectRef = useRef<DOMRect | null>(null)
  const pendingConsumeRef = useRef(false)
  const prevForgottenRef = useRef(false)
  const cards = deckCardsSorted(Object.values(state.player.deck.cardById))
  const powerDisplay = powerDisplayContextFromPlayer(state.player)

  useEffect(() => {
    const forgotten = fol?.cardForgotten === true
    const justForgot = forgotten && !prevForgottenRef.current
    prevForgottenRef.current = forgotten
    if (!justForgot) return
    if (!pendingConsumeRef.current) return
    const rect = pendingConsumeRectRef.current
    pendingConsumeRef.current = false
    pendingConsumeRectRef.current = null
    if (!rect) return
    const delay = fontOfLetheForgetConsumeDelayMs()
    window.setTimeout(() => playCardConsume({ sourceRect: rect }), delay)
  }, [fol?.cardForgotten, playCardConsume])

  return (
    <div
      ref={overlayRef}
      className="fontOfLetheForgetOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fontOfLetheForgetTitle"
    >
      <div className="fontOfLetheForgetPanel">
        <h2 id="fontOfLetheForgetTitle" className="fontOfLetheForgetTitle">
          Forget card
        </h2>
        <p className="fontOfLetheForgetSub">Choose a card to remove from your deck forever.</p>
        <div className="fontOfLetheForgetActions">
          <button
            type="button"
            className="fontOfLetheForgetSubmit"
            disabled={!canForget}
            onClick={() => {
              if (!canForget) return
              const host = overlayRef.current
              const cardEl = host?.querySelector<HTMLElement>(`[data-fol-card-instance-id="${selectedId}"]`) ?? null
              pendingConsumeRectRef.current = cardEl ? cardEl.getBoundingClientRect() : null
              pendingConsumeRef.current = true

              // Immediate poof cue at a fixed, tokenized anchor.
              const p = fontOfLetheForgetPoofViewportPoint()
              const cueRect = new DOMRect(p.x - 1, p.y - 1, 2, 2)
              playCardConsume({
                sourceRect: cueRect,
                hostClassName: 'cardConsumeHost--fontOfLetheForgetPoof',
                hostStyle: {
                  '--card-consume-puff-height-tiny': 'var(--font-of-lethe-forget-poof-puff-height-tiny)',
                  '--card-consume-puff-height-poof': 'var(--font-of-lethe-forget-poof-puff-height-poof)',
                  '--card-consume-puff-height-big': 'var(--font-of-lethe-forget-poof-puff-height-big)',
                  '--card-consume-puff-start-opacity': 'var(--font-of-lethe-forget-poof-sprite-opacity)',
                  '--card-consume-aftermath-w': 'var(--font-of-lethe-forget-poof-aftermath-w)',
                  '--card-consume-aftermath-h': 'var(--font-of-lethe-forget-poof-aftermath-h)',
                  '--card-consume-aftermath-start-opacity': 'var(--font-of-lethe-forget-poof-sprite-opacity)',
                  '--duration-card-consume-puff-fade': 'var(--duration-font-of-lethe-forget-poof-puff-fade)',
                  '--duration-card-consume-aftermath-fade': 'var(--duration-font-of-lethe-forget-poof-aftermath-fade)',
                },
              })
              enqueue({ type: 'FONT_OF_LETHE/FORGET' })
            }}
          >
            Forget
          </button>
        </div>
        <div className="fontOfLetheForgetHand">
          {cards.map((inst) => {
            const t = Cards[inst.templateId]
            const selected = selectedId === inst.id
            return (
              <div
                key={inst.id}
                className="fontOfLetheForgetCardSlot gameCardHoverHost"
                data-fol-card-instance-id={inst.id}
              >
                <GameCardView
                  inst={inst}
                  template={t}
                  powerDisplay={powerDisplay}
                  gameLevel={state.level}
                  selected={selected}
                  className="fontOfLetheForgetCard"
                  onClick={() => enqueue({ type: 'FONT_OF_LETHE/SELECT_CARD', cardInstanceId: inst.id })}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
