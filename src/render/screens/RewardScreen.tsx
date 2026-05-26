import { isRewardLootFullyCollected } from '../../systems/rewards/rewardLoot'
import { plainCelesteBackdrop, plainGreyBackdropCombat } from '../assets/backdropImages'
import { CardOfferRow } from '../primitives/CardOfferRow'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RelicOfferRow } from '../primitives/RelicOfferRow'
import { goldBagSprite, keySprite, leatherCarpet } from '../assets/displayImages'
import { useGoldTravel } from '../GoldTravelContext'
import { useKeyTravel } from '../KeyTravelContext'
import type { ScreenProps } from './types'

export function RewardScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const { travelGoldToHud, travelingGold } = useGoldTravel()
  const { travelKeyToHud, travelingKey } = useKeyTravel()
  const rw = state.cardReward
  const rewardGold = rw?.goldEarned ?? 0
  const rewardKeys = rw?.keysEarned ?? 0
  const rewardKind = rw?.kind
  const lootComplete = rw != null ? isRewardLootFullyCollected(rw) : true
  const hasLoot = rewardGold > 0 || rewardKeys > 0
  const choiceLine = rewardKind === 'RELIC' ? 'Choose a relic to proceed:' : 'Choose a card to proceed:'

  const title = !hasLoot ? (
    <>{choiceLine}</>
  ) : !lootComplete ? (
    <>Victory! Pick up your spoils:</>
  ) : (
    <>{choiceLine}</>
  )

  const showCardOrRelicChoice = !hasLoot || lootComplete
  const useCardRewardBackdrop = showCardOrRelicChoice && rewardKind === 'CARD'

  return (
    <>
      <div
        className={
          useCardRewardBackdrop
            ? 'screenBackdrop screenBackdrop--cardReward'
            : 'screenBackdrop screenBackdrop--combatReward'
        }
        aria-hidden
      >
        <img
          className="screenBackdrop__img"
          src={useCardRewardBackdrop ? plainCelesteBackdrop : plainGreyBackdropCombat}
          alt=""
          draggable={false}
        />
      </div>
      {!useCardRewardBackdrop ? (
        <img
          className="combatRewardLeatherCarpet"
          src={leatherCarpet}
          alt=""
          draggable={false}
          aria-hidden
        />
      ) : null}
      <CenteredPanel
        title={title}
        panelClassName={
          showCardOrRelicChoice && rewardKind === 'CARD'
            ? 'cardOfferPanel'
            : !useCardRewardBackdrop
              ? 'combatRewardPanel'
              : undefined
        }
      >
        {rw != null && hasLoot && !lootComplete ? (
          <div className="rewardLootRow">
            {rewardGold > 0 && !rw.goldPickedUp ? (
              <button
                type="button"
                className={['rewardLootPickup', travelingGold ? 'rewardLootPickup--traveling' : null]
                  .filter(Boolean)
                  .join(' ') || undefined}
                disabled={travelingGold}
                aria-label={`Pick up ${rewardGold} gold`}
                onClick={(e) => {
                  travelGoldToHud({
                    sourceEl: e.currentTarget,
                    amount: rewardGold,
                    onComplete: () => enqueue({ type: 'REWARD/PICK_GOLD' }),
                  })
                }}
              >
                <img className="rewardLootPickup__img" src={goldBagSprite} alt="" draggable={false} />
                <span className="rewardLootPickup__amount">{rewardGold}</span>
              </button>
            ) : null}
            {rewardKeys > 0 && !rw.keysPickedUp ? (
              <button
                type="button"
                className={['rewardLootPickup', travelingKey ? 'rewardLootPickup--traveling' : null]
                  .filter(Boolean)
                  .join(' ') || undefined}
                disabled={travelingKey}
                aria-label={`Pick up ${rewardKeys} key${rewardKeys === 1 ? '' : 's'}`}
                onClick={(e) => {
                  travelKeyToHud({
                    sourceEl: e.currentTarget,
                    onComplete: () => enqueue({ type: 'REWARD/PICK_KEYS' }),
                  })
                }}
              >
                <img className="rewardLootPickup__img" src={keySprite} alt="" draggable={false} />
                <span className="rewardLootPickup__amount">{rewardKeys}</span>
              </button>
            ) : null}
          </div>
        ) : null}
        {showCardOrRelicChoice && rewardKind === 'CARD' ? (
          <CardOfferRow
            offers={state.cardReward?.kind === 'CARD' ? state.cardReward.offered : []}
            power={state.player.power}
            firepowerMultiplier={state.player.firepowerMultiplier}
            shieldPower={state.player.shieldPower}
            onPick={(cardId) => enqueue({ type: 'REWARD/PICK_CARD', cardId })}
          />
        ) : showCardOrRelicChoice && rewardKind === 'RELIC' && state.cardReward?.kind === 'RELIC' ? (
          <RelicOfferRow
            relicIds={state.cardReward.offered}
            beltSlotIndex={state.player.relics.length}
            onPick={(relicId) => enqueue({ type: 'REWARD/PICK_RELIC', relicId })}
          />
        ) : null}
      </CenteredPanel>
    </>
  )
}
