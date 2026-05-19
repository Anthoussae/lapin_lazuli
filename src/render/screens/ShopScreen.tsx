import { useState } from 'react'
import { Cards } from '../../data/cards'
import { Relics } from '../../data/relics'
import { cardDescriptionLinesForOffer, describeRelicEffect, formatCardName } from '../../ui/describe'
import { keySprite } from '../assets/displayImages'
import { relicImageMap } from '../assets/relicImages'
import { useCardTravel } from '../CardTravelContext'
import { useKeyTravel } from '../KeyTravelContext'
import { useRelicTravel } from '../RelicTravelContext'
import { GameCardView } from '../primitives/GameCardView'
import { TickingNumber } from '../primitives/TickingNumber'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RelicIcon } from '../primitives/RelicIcon'
import type { ScreenProps } from './types'

export function ShopScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const { travelRelicToBelt } = useRelicTravel()
  const { travelCardToDeck, travelingCardKey } = useCardTravel()
  const { travelKeyToHud, travelingKey } = useKeyTravel()
  const [shopRelicTravelSlot, setShopRelicTravelSlot] = useState<number | null>(null)
  const shop = state.shop
  if (!shop) return null

  const relicTraveling = shopRelicTravelSlot != null
  const cardTraveling = travelingCardKey != null
  const picking = relicTraveling || cardTraveling || travelingKey

  return (
    <CenteredPanel title="Shop" panelClassName="shopPanel">
      <div className="shopGoldLine">
        Gold: <TickingNumber value={state.player.gold} />
      </div>
      <div className="shopGrid">
        {shop.items.map((item, slotIndex) => {
          if (item.sold) return null
          const canBuy = state.player.gold >= item.price
          const buy = () => {
            if (!canBuy) return
            enqueue({ type: 'SHOP/BUY_ITEM', slotIndex })
          }

          if (item.kind === 'RELIC') {
            const r = Relics[item.relicId]
            const title = r?.name ?? item.relicId
            const isChosenRelic = shopRelicTravelSlot === slotIndex
            return (
              <div key={`shop-${slotIndex}`} className="shopRelicSlot">
                <RelicIcon
                  imageSrc={relicImageMap[item.relicId]}
                  fallback={r?.thumb ?? '?'}
                  alt={r?.name}
                  tooltipName={title}
                  tooltipEffect={r ? describeRelicEffect(r) : ''}
                  traveling={isChosenRelic}
                  disabled={!canBuy}
                  onClick={(e) => {
                    if (picking || !canBuy) return
                    setShopRelicTravelSlot(slotIndex)
                    travelRelicToBelt({
                      templateId: item.relicId,
                      sourceEl: e.currentTarget,
                      beltSlotIndex: state.player.relics.length,
                      onComplete: () => {
                        setShopRelicTravelSlot(null)
                        buy()
                      },
                    })
                  }}
                />
                <span className="shopRelicPrice">{item.price}g</span>
              </div>
            )
          }

          if (item.kind === 'KEY') {
            return (
              <div key={`shop-${slotIndex}`} className="shopRelicSlot">
                <button
                  type="button"
                  className={['shopKeyOffer', travelingKey ? 'shopKeyOffer--traveling' : null]
                    .filter(Boolean)
                    .join(' ') || undefined}
                  disabled={!canBuy || picking}
                  onClick={(e) => {
                    if (!canBuy || picking) return
                    travelKeyToHud({ sourceEl: e.currentTarget, onComplete: buy })
                  }}
                  aria-label={`Buy key for ${item.price} gold`}
                >
                  <img className="shopKeyOffer__img" src={keySprite} alt="Key" draggable={false} />
                </button>
                <span className="shopRelicPrice">{item.price}g</span>
              </div>
            )
          }

          const t = Cards[item.cardId]
          const label = t ? formatCardName(t.name, item.upgrades) : item.cardId
          const cardKey = `shop-${item.cardId}-${slotIndex}`
          const isChosen = travelingCardKey === cardKey
          return (
            <div key={cardKey} className="cardOfferSlot">
              <button
                type="button"
                className="shopCardOffer"
                disabled={!canBuy || picking}
                onClick={(e) => {
                  if (picking || !canBuy) return
                  travelCardToDeck({
                    cardKey,
                    sourceEl: e.currentTarget,
                    card: {
                      name: label,
                      inkLabel: t?.cost !== null && t?.cost !== undefined ? String(t.cost) : null,
                      descriptionLines: t ? cardDescriptionLinesForOffer(t, item.upgrades) : [],
                    },
                    onComplete: () => enqueue({ type: 'SHOP/BUY_ITEM', slotIndex }),
                  })
                }}
              >
                <GameCardView
                  template={t}
                  offerUpgradeApplications={item.upgrades}
                  power={state.player.power}
                  firepowerMultiplier={state.player.firepowerMultiplier}
                  className={isChosen ? 'gameCard--traveling' : undefined}
                />
                <span className="shopCardOffer__price">{item.price}g</span>
              </button>
            </div>
          )
        })}
      </div>
      <button type="button" className="btn" disabled={picking} onClick={() => enqueue({ type: 'SHOP/LEAVE' })}>
        Leave Shop
      </button>
    </CenteredPanel>
  )
}
