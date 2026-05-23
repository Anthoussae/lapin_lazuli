import { useCallback, useRef } from 'react'
import { consumeCardAftermathSprite } from '../assets/displayImages'
import { CardConsumePuffs } from './CardConsumePuffs'

export type CardConsumeFxProps = Readonly<{
  fxId: number
  seed: number
  onComplete: (fxId: number) => void
}>

/** Outward poof burst + dissolving card silhouette at a consume anchor. */
export function CardConsumeFx(props: CardConsumeFxProps) {
  const { fxId, seed, onComplete } = props
  const doneRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onCompleteRef.current(fxId)
  }, [fxId])

  return (
    <div className="cardConsumeFx" aria-hidden>
      <CardConsumePuffs seed={seed} />
      <img
        className="cardConsumeFx__aftermath"
        src={consumeCardAftermathSprite}
        alt=""
        draggable={false}
        onAnimationEnd={(e) => {
          if (e.currentTarget !== e.target) return
          if (e.animationName !== 'cardConsumeAftermathFade') return
          finish()
        }}
      />
    </div>
  )
}
