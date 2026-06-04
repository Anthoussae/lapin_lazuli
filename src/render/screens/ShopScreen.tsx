import { useShopUnaffordableReject } from '../ShopUnaffordableRejectContext'
import { Cards } from '../../data/cards'
import { Relics } from '../../data/relics'
import { describeRelicEffect } from '../../ui/describe'
import { powerDisplayContextFromPlayer } from '../../systems/combat/powerDisplay'
import { buildGameCardDisplayForOffer, toCardTravelPayload } from '../gameCardDisplay'
import { shopBackdrop } from '../assets/backdropImages'
import { keySprite, shopShelvesSprite } from '../assets/displayImages'
import { relicImageMap } from '../assets/relicImages'
import { useCardTravel } from '../CardTravelContext'
import { useKeyTravel } from '../KeyTravelContext'
import { useRelicTravel } from '../RelicTravelContext'
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
  const powerDisplay = powerDisplayContextFromPlayer(state.player)

  if (!shop) return null

  const cardTraveling = travelingCardKey != null
  const picking = travelingTemplateId != null || cardTraveling || travelingKey

  const shelfSlotClass = (slotIndex: number, canBuy: boolean, extra?: string) =>
    [
      'shopShelfSlot gameCardHoverHost',
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
            const isChosen = travelingTemplateId === item.relicId
            return (
              <div key={`shop-${slotIndex}`} className={shelfSlotClass(slotIndex, canBuy, 'shopRelicSlot')}>
                <RelicIcon
                  relicId={item.relicId}
                  imageSrc={relicImageMap[item.relicId]}
                  fallback={r?.thumb ?? '?'}
                  alt={r?.name}
                  tooltipName={title}
                  tooltipEffect={r ? describeRelicEffect(r) : ''}
                  traveling={isChosen}
                  disabled={picking}
                  onClick={(e) => {
                    if (picking) return
                    if (!canBuy) {
                      flashUnaffordable(slotIndex)
                      return
                    }
                    const beltSlotIndex = state.player.relics.length
                    travelRelicToBelt({
                      templateId: item.relicId,
                      sourceEl: e.currentTarget,
                      beltSlotIndex,
                      onComplete: buy,
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
          const cardKey = `shop-${item.cardId}-${slotIndex}`
          const isChosen = travelingCardKey === cardKey
          const display = t
            ? buildGameCardDisplayForOffer(t, item.upgrades, powerDisplay, false, state.level)
            : null
          const facePayload = display ? toCardTravelPayload(display) : null
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
                  if (!facePayload) return
                  travelCardToDeck({
                    cardKey,
                    sourceEl: e.currentTarget,
                    card: facePayload,
                    onComplete: () => enqueue({ type: 'SHOP/BUY_ITEM', slotIndex }),
                  })
                }}
              >
                <GameCardView
                  display={display ?? undefined}
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
