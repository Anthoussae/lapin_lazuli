import type { GameState } from '../../core/types/state'
import { coin1Sprite, keySprite } from '../assets/displayImages'
import { useGoldTravel } from '../GoldTravelContext'
import { useKeyTravel } from '../KeyTravelContext'
import { useShopUnaffordableRejectGoldFlash } from '../ShopUnaffordableRejectContext'
import { TickingNumber } from './TickingNumber'

export function CounterHud(props: Readonly<{ state: GameState }>) {
  const { state } = props
  const { keysHudRef } = useKeyTravel()
  const { goldHudRef } = useGoldTravel()
  const goldRejectFlash = useShopUnaffordableRejectGoldFlash()
  return (
    <div className="hudBoxDisplay" aria-label="Counters">
      <div className="hudBoxDisplay__item hudText">Level: {state.level}</div>
      <div
        ref={keysHudRef}
        className="hudBoxDisplay__item hudBoxDisplay__counter hudText counterHud__keys"
        aria-label={`Keys: ${state.player.keys}`}
      >
        <img className="hudBoxDisplay__icon" src={keySprite} alt="" draggable={false} aria-hidden />
        <TickingNumber value={state.player.keys} />
      </div>
      <div
        ref={goldHudRef}
        className={[
          'hudBoxDisplay__item',
          'hudBoxDisplay__counter',
          'hudText',
          'counterHud__gold',
          goldRejectFlash ? 'counterHud__gold--rejectFlash' : null,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={`Gold: ${state.player.gold}`}
      >
        <img className="hudBoxDisplay__icon" src={coin1Sprite} alt="" draggable={false} aria-hidden />
        <TickingNumber value={state.player.gold} />
      </div>
    </div>
  )
}
