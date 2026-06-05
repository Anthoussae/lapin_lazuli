import { useCallback } from 'react'
import type { GameState } from '../core/types/state'
import type { GameAction, PlayerAction } from '../reducers/actions'
import { BarHud } from './primitives/BarHud'
import { CounterHud } from './primitives/CounterHud'
import { RoomInfoHud } from './primitives/RoomInfoHud'
import { RelicBelt } from './primitives/RelicBelt'
import { DeckInspect } from './primitives/DeckInspect'
import { CombatScreen } from './screens/CombatScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { TitleScreen } from './screens/TitleScreen'
import { StarterRelicScreen } from './screens/StarterRelicScreen'
import { PathScreen } from './screens/PathScreen'
import { ShopScreen } from './screens/ShopScreen'
import { RestScreen } from './screens/RestScreen'
import { GemstoneCavernScreen } from './screens/GemstoneCavernScreen'
import { TreasureRoomScreen } from './screens/TreasureRoomScreen'
import { MysteryRoomScreen } from './screens/MysteryRoomScreen'
import { RewardScreen } from './screens/RewardScreen'
import { VictoryScreen } from './screens/VictoryScreen'
import { DefeatScreen } from './screens/DefeatScreen'
import { CastBurstProvider } from './CastBurstContext'
import { CardConsumeProvider } from './CardConsumeContext'
import { CardSocketFlipProvider } from './CardSocketFlipContext'
import { BunnyReleaseProvider } from './BunnyReleaseContext'
import { BubblePopFxProvider } from './BubblePopFxContext'
import { PoisonCardHitFxProvider } from './PoisonCardHitFxContext'
import { PoisonHpBarTintProvider } from './PoisonHpBarTintContext'
import { FireDamageHitFxProvider } from './FireDamageHitFxContext'
import { FireHpBarTintProvider } from './FireHpBarTintContext'
import { AntiMagicShellPopFxProvider } from './AntiMagicShellPopFxContext'
import { FireReleaseProvider } from './FireReleaseContext'
import { CardTravelProvider } from './CardTravelContext'
import { GoldTravelProvider } from './GoldTravelContext'
import { ShopUnaffordableRejectProvider } from './ShopUnaffordableRejectContext'
import { KeyTravelProvider } from './KeyTravelContext'
import { RelicTravelProvider } from './RelicTravelContext'
import { IrisTransitionProvider } from './IrisTransitionContext'
import { EnchantmentSpriteTriggerFxProvider } from './EnchantmentSpriteTriggerFxContext'
import { TriggerFxProvider } from './TriggerFxContext'
import { CriticalFxProvider } from './CriticalFxContext'
import { DodgeFxProvider } from './DodgeFxContext'
import { PlayerHitFxProvider } from './PlayerHitFxContext'
import './game.css'

export function GameView(props: Readonly<{ state: GameState; dispatch: (a: GameAction) => void }>) {
  const { state, dispatch } = props
  const enqueue = (action: PlayerAction) => dispatch({ type: 'INPUT/INTENT_ENQUEUE', action })
  const inCombat = state.combat && (state.phase.startsWith('COMBAT_') || state.phase === 'ANIMATING')
  const showHud = state.phase !== 'TITLE'
  const screenProps = { state, enqueue }
  const onBunnyReleaseComplete = useCallback(
    () => dispatch({ type: 'COMBAT/COMPLETE_BUNNY_RELEASE' }),
    [dispatch],
  )
  const onCompleteTurnStartDraw = useCallback(
    () => dispatch({ type: 'COMBAT/COMPLETE_TURN_START_DRAW' }),
    [dispatch],
  )

  return (
    <RelicTravelProvider>
      <BubblePopFxProvider>
      <PoisonCardHitFxProvider state={state}>
      <PoisonHpBarTintProvider state={state}>
      <FireDamageHitFxProvider state={state}>
      <FireHpBarTintProvider state={state}>
      <AntiMagicShellPopFxProvider>
      <EnchantmentSpriteTriggerFxProvider state={state}>
      <TriggerFxProvider state={state}>
      <CriticalFxProvider state={state}>
      <PlayerHitFxProvider state={state}>
      <DodgeFxProvider state={state}>
      <IrisTransitionProvider>
      <BunnyReleaseProvider
        bunnyReleasePending={!!state.combat?.bunnyReleasePending}
        bunnyReleaseSpriteCount={state.combat?.bunnyReleaseSpriteCount ?? 0}
        bunnyReleaseBunnyCount={
          state.combat?.bunnyReleasePending ? Math.max(0, state.player.bunnies) : 0
        }
        onComplete={onBunnyReleaseComplete}
      >
      <FireReleaseProvider>
      <CastBurstProvider>
      <CardConsumeProvider>
      <CardSocketFlipProvider>
      <CardTravelProvider>
      <KeyTravelProvider>
      <GoldTravelProvider>
      <ShopUnaffordableRejectProvider>
      {showHud ? (
        <>
          <div className="gameHud" aria-label="Game HUD">
            <div className="playerHudStack">
              {!inCombat ? <BarHud state={state} inCombat={false} /> : null}
              <CounterHud state={state} />
            </div>
            <RelicBelt state={state} />
          </div>
          <RoomInfoHud state={state} />
        </>
      ) : null}
      {inCombat && state.combat && (
        <CombatScreen
          {...screenProps}
          dispatch={dispatch}
          onCompleteTurnStartDraw={onCompleteTurnStartDraw}
        />
      )}
      {state.phase === 'BOOT' && <LoadingScreen state={state} />}
      {state.phase === 'TITLE' && <TitleScreen {...screenProps} />}
      {state.phase === 'RELIC_SELECT_STARTER' && <StarterRelicScreen {...screenProps} />}
      {state.phase === 'PATH_SELECT' && <PathScreen {...screenProps} />}
      {state.phase === 'SHOP' && state.shop && <ShopScreen {...screenProps} />}
      {state.phase === 'REST' && <RestScreen {...screenProps} />}
      {state.phase === 'GEMSTONE_CAVERN' && <GemstoneCavernScreen {...screenProps} />}
      {state.phase === 'TREASURE_ROOM' && <TreasureRoomScreen {...screenProps} />}
      {state.phase === 'EVENT' && state.mysteryRoom?.roomId && (
        <MysteryRoomScreen {...screenProps} />
      )}
      {state.phase === 'REWARD' && <RewardScreen {...screenProps} />}
      {state.phase === 'GAME_WIN' && <VictoryScreen {...screenProps} />}
      {state.phase === 'DEFEAT' && <DefeatScreen {...screenProps} />}
      {showHud && (
        <DeckInspect state={state} inCombat={!!inCombat} />
      )}
      </ShopUnaffordableRejectProvider>
      </GoldTravelProvider>
      </KeyTravelProvider>
      </CardTravelProvider>
      </CardSocketFlipProvider>
      </CardConsumeProvider>
      </CastBurstProvider>
      </FireReleaseProvider>
      </BunnyReleaseProvider>
      </IrisTransitionProvider>
      </DodgeFxProvider>
      </PlayerHitFxProvider>
      </CriticalFxProvider>
      </TriggerFxProvider>
      </EnchantmentSpriteTriggerFxProvider>
      </AntiMagicShellPopFxProvider>
      </FireHpBarTintProvider>
      </FireDamageHitFxProvider>
      </PoisonHpBarTintProvider>
      </PoisonCardHitFxProvider>
      </BubblePopFxProvider>
    </RelicTravelProvider>
  )
}
