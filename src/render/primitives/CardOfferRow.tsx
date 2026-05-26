import type { CardId } from '../../core/types/ids'
import { Cards } from '../../data/cards'
import { cardDescriptionLinesForOffer, formatCardName } from '../../ui/describe'
import { blueCarpet } from '../assets/displayImages'
import { useCardTravel } from '../CardTravelContext'
import { GameCardView } from './GameCardView'
import { RelicRejectPuffs } from './RelicRejectPuffs'

export type CardOffer = Readonly<{
  cardId: CardId
  upgrades: number
}>

export function CardOfferRow(
  props: Readonly<{
    offers: ReadonlyArray<CardOffer>
    onPick: (cardId: CardId) => void
    power?: number
    firepowerMultiplier?: number
    shieldPower?: number
  }>,
) {
  const { offers, onPick, power = 0, firepowerMultiplier = 0, shieldPower = 0 } = props
  const { travelCardToDeck, travelingCardKey } = useCardTravel()
  const picking = travelingCardKey != null

  return (
    <div className="cardOffer">
      <img className="cardOffer__carpet" src={blueCarpet} alt="" draggable={false} />
      <div className="cardRewardRow">
        {offers.map((o, idx) => {
          const t = Cards[o.cardId]
          const label = t ? formatCardName(t.name, o.upgrades) : o.cardId
          const cardKey = `${o.cardId}-${idx}`
          const isChosen = travelingCardKey === cardKey
          const isRejected = picking && !isChosen

          return (
            <div key={cardKey} className="cardOfferSlot">
              {isRejected ? <RelicRejectPuffs /> : null}
              <button
                type="button"
                className="cardOfferBtn"
                disabled={picking}
                onClick={(e) => {
                  if (picking) return
                  travelCardToDeck({
                    cardKey,
                    sourceEl: e.currentTarget,
                    card: {
                      cardId: o.cardId,
                      name: label,
                      inkLabel: t?.cost !== null && t?.cost !== undefined ? String(t.cost) : null,
                      descriptionLines: t
                        ? cardDescriptionLinesForOffer(t, o.upgrades, power, firepowerMultiplier, shieldPower)
                        : [],
                    },
                    onComplete: () => onPick(o.cardId),
                  })
                }}
              >
                <GameCardView
                  template={t}
                  offerUpgradeApplications={o.upgrades}
                  power={power}
                  firepowerMultiplier={firepowerMultiplier}
                  shieldPower={shieldPower}
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
