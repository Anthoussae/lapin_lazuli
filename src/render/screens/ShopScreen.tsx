import { useShopUnaffordableReject } from '../ShopUnaffordableRejectContext'
import { Cards } from '../../data/cards'
import { Relics } from '../../data/relics'
import { cardDescriptionLinesForOffer, describeRelicEffect, formatCardName } from '../../ui/describe'
import { shopBackdrop } from '../assets/backdropImages'
import { keySprite, shopShelvesSprite } from '../assets/displayImages'
import { relicImageMap } from '../assets/relicImages'
import { useCardTravel } from '../CardTravelContext'
import { useKeyTravel } from '../KeyTravelContext'
import { useRelicTravel } from '../RelicTravelContext'
import { relicIconViewportRect } from '../relicBeltLayout'
import { GameCardView } from '../primitives/GameCardView'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RelicIcon } from '../primitives/RelicIcon'
import type { ScreenProps } from './types'

export function ShopScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const { travelRelicToBelt, travelingTemplateId } = useRelicTravel()
  const { travelCardToDeck, travelingCardKey } = useCardTravel()
  const { travelKeyToHud, travelingKey } = useKeyTravel()
  const { rejectFlashSlot, flashUnaffordable } = useShopUnaffordableReject()
  const shop = state.shop

  if (!shop) return null

  const cardTraveling = travelingCardKey != null
  const picking = travelingTemplateId != null || cardTraveling || travelingKey

  const shelfSlotClass = (slotIndex: number, canBuy: boolean, extra?: string) =>
    [
      'shopShelfSlot',
      extra,
      !canBuy ? 'shopShelfSlot--unaffordable' : null,
      rejectFlashSlot === slotIndex ? 'shopShelfSlot--rejectFlash' : null,
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <>
      <div className="screenBackdrop screenBackdrop--shop" aria-hidden>
        <img className="screenBackdrop__img" src={shopBackdrop} alt="" draggable={false} />
      </div>
      <CenteredPanel panelClassName="shopPanel">
      <div className="shopShelves">
        <img className="shopShelves__bg" src={shopShelvesSprite} alt="" draggable={false} />
        <div className="shopGrid">
        {shop.items.map((item, slotIndex) => {
          if (item.sold) {
            return <div key={`shop-sold-${slotIndex}`} className="shopShelfSlot shopShelfSlot--sold" aria-hidden />
          }
          const canBuy = state.player.gold >= item.price
          const buy = () => {
            if (!canBuy) return
            enqueue({ type: 'SHOP/BUY_ITEM', slotIndex })
          }

          if (item.kind === 'RELIC') {
            const r = Relics[item.relicId]
            const title = r?.name ?? item.relicId
            return (
              <div key={`shop-${slotIndex}`} className={shelfSlotClass(slotIndex, canBuy, 'shopRelicSlot')}>
                <RelicIcon
                  imageSrc={relicImageMap[item.relicId]}
                  fallback={r?.thumb ?? '?'}
                  alt={r?.name}
                  tooltipName={title}
                  tooltipEffect={r ? describeRelicEffect(r) : ''}
                  disabled={picking}
                  onClick={(e) => {
                    if (picking) return
                    if (!canBuy) {
                      flashUnaffordable(slotIndex)
                      return
                    }
                    const sourceRect = relicIconViewportRect(e.currentTarget)
                    const beltSlotIndex = state.player.relics.length
                    buy()
                    travelRelicToBelt({
                      templateId: item.relicId,
                      sourceRect,
                      beltSlotIndex,
                      onComplete: () => {},
                    })
                  }}
                />
                <span className="shopRelicPrice">{item.price}g</span>
              </div>
            )
          }

          if (item.kind === 'KEY') {
            return (
              <div key={`shop-${slotIndex}`} className={shelfSlotClass(slotIndex, canBuy, 'shopRelicSlot')}>
                <button
                  type="button"
                  className={[
                    'shopKeyOffer',
                    !canBuy ? 'shopKeyOffer--unaffordable' : null,
                    travelingKey ? 'shopKeyOffer--traveling' : null,
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined}
                  disabled={picking}
                  onClick={(e) => {
                    if (picking) return
                    if (!canBuy) {
                      flashUnaffordable(slotIndex)
                      return
                    }
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
            <div key={cardKey} className={shelfSlotClass(slotIndex, canBuy, 'cardOfferSlot')}>
              <button
                type="button"
                className={['shopCardOffer', !canBuy ? 'shopCardOffer--unaffordable' : null].filter(Boolean).join(' ') || undefined}
                disabled={picking}
                onClick={(e) => {
                  if (picking) return
                  if (!canBuy) {
                    flashUnaffordable(slotIndex)
                    return
                  }
                  travelCardToDeck({
                    cardKey,
                    sourceEl: e.currentTarget,
                    card: {
                      cardId: item.cardId,
                      name: label,
                      inkLabel: t?.cost !== null && t?.cost !== undefined ? String(t.cost) : null,
                      descriptionLines: t
                        ? cardDescriptionLinesForOffer(t, item.upgrades, state.player.power, state.player.firepowerMultiplier)
                        : [],
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
      </div>
      <button
        type="button"
        className="btn shopLeaveBtn"
        disabled={picking}
        onClick={() => enqueue({ type: 'SHOP/LEAVE' })}
      >
        Leave Shop
      </button>
      </CenteredPanel>
    </>
  )
}
