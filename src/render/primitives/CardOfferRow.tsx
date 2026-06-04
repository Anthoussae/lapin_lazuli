import type { CardId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { EMPTY_POWER_DISPLAY, type PowerDisplayContext } from '../../systems/combat/powerDisplay'
import { blueCarpet } from '../assets/displayImages'
import { useCardTravel } from '../CardTravelContext'
import { buildGameCardDisplayForOffer, toCardTravelPayload } from '../gameCardDisplay'
import { GameCardView } from './GameCardView'
import { RelicRejectPuffs } from './RelicRejectPuffs'

export type CardOffer = Readonly<{
  cardId: CardId
  upgrades: number
  foil?: boolean
}>

export function CardOfferRow(
  props: Readonly<{
    offers: ReadonlyArray<CardOffer>
    onPick: (cardId: CardId) => void
    powerDisplay?: PowerDisplayContext
    gameLevel?: number
  }>,
) {
  const { offers, onPick, powerDisplay = EMPTY_POWER_DISPLAY, gameLevel = 1 } = props
  const { travelCardToDeck, travelingCardKey } = useCardTravel()
  const picking = travelingCardKey != null

  return (
    <div className="cardOffer">
      <img className="cardOffer__carpet" src={blueCarpet} alt="" draggable={false} />
      <div className="cardRewardRow">
        {offers.map((o, idx) => {
          const t = Cards[o.cardId]
          const cardKey = `${o.cardId}-${idx}`
          const isChosen = travelingCardKey === cardKey
          const isRejected = picking && !isChosen
          const display = t
            ? buildGameCardDisplayForOffer(t, o.upgrades, powerDisplay, o.foil === true, gameLevel)
            : null
          const facePayload = display ? toCardTravelPayload(display) : null

          return (
            <div key={cardKey} className="cardOfferSlot gameCardHoverHost">
              {isRejected ? <RelicRejectPuffs /> : null}
              <button
                type="button"
                className="cardOfferBtn"
                disabled={picking}
                onClick={(e) => {
                  if (picking || !facePayload) return
                  travelCardToDeck({
                    cardKey,
                    sourceEl: e.currentTarget,
                    card: facePayload,
                    onComplete: () => onPick(o.cardId),
                  })
                }}
              >
                <GameCardView
                  display={display ?? undefined}
                  className={[
                    isRejected ? 'gameCard--rejected' : null,
                    isChosen ? 'gameCard--traveling' : null,
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
