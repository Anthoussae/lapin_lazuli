import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react'
import { cardBackArt } from '../assets/cardImages'
import type { CardTravelPayload } from '../CardTravelContext'
import { Card } from './Card'

export type CardSocketFlipFxProps = Readonly<{
  fxId: number
  cardBefore: CardTravelPayload
  cardAfter: CardTravelPayload
  onComplete: (fxId: number) => void
}>

type FlipPhase = 'toBack' | 'toFront' | 'glow' | 'done'

/** Flip to reverse, swap to upgraded front, flip back, brief glow. */
export function CardSocketFlipFx(props: CardSocketFlipFxProps) {
  const { fxId, cardBefore, cardAfter, onComplete } = props
  const [flipped, setFlipped] = useState(false)
  const [showUpgraded, setShowUpgraded] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const phaseRef = useRef<FlipPhase>('toBack')
  const doneRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onCompleteRef.current(fxId)
  }, [fxId])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFlipped(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleFlipTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.currentTarget !== e.target) return
      if (e.propertyName !== 'transform') return

      if (phaseRef.current === 'toBack' && flipped) {
        phaseRef.current = 'toFront'
        setShowUpgraded(true)
        requestAnimationFrame(() => setFlipped(false))
        return
      }

      if (phaseRef.current === 'toFront' && !flipped) {
        phaseRef.current = 'glow'
        setGlowing(true)
      }
    },
    [flipped],
  )

  const card = showUpgraded ? cardAfter : cardBefore

  return (
    <div
      className={['cardSocketFlipFx', glowing ? 'cardSocketFlipFx--glow' : null].filter(Boolean).join(' ')}
      aria-hidden
    >
      <div
        className={['cardSocketFlipFx__flipper', flipped ? 'cardSocketFlipFx__flipper--flipped' : null]
          .filter(Boolean)
          .join(' ')}
        onTransitionEnd={handleFlipTransitionEnd}
      >
        <div className="cardSocketFlipFx__face cardSocketFlipFx__face--front">
          <Card
            face="front"
            cardId={card.cardId}
            name={card.name}
            nameUpgraded={card.nameUpgraded}
            inkLabel={card.inkLabel}
            descriptionLines={card.descriptionLines}
            socketedGemId={card.socketedGemId ?? null}
            foil={card.foil === true}
            staticDisplay
          />
        </div>
        <div className="cardSocketFlipFx__face cardSocketFlipFx__face--back">
          <img className="cardSocketFlipFx__backImg" src={cardBackArt} alt="" draggable={false} />
        </div>
      </div>
      <div
        className="cardSocketFlipFx__glow"
        onAnimationEnd={(e) => {
          if (e.currentTarget !== e.target) return
          if (e.animationName !== 'cardSocketFlipGlow') return
          if (phaseRef.current !== 'glow') return
          phaseRef.current = 'done'
          finish()
        }}
      />
    </div>
  )
}
