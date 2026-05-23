import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../actions'
import { isRewardLootFullyCollected } from '../../systems/rewards/rewardLoot'

export function isActionLegalNow(state: GameState, action: PlayerAction): boolean {
  if (state.phase === 'BOOT') return false

  if (
    (state.combat?.monsterDefeatPending || state.combat?.playerDefeatPending) &&
    action.type.startsWith('COMBAT/')
  ) {
    return false
  }

  if (state.phase === 'TITLE') {
    return action.type === 'TITLE/NEW_GAME'
  }

  if (state.phase === 'RELIC_SELECT_STARTER') {
    return action.type === 'RELIC/CHOOSE_STARTER'
  }

  if (state.phase === 'PATH_SELECT') {
    return action.type === 'PATH/CHOOSE' || action.type === 'PATH/UNLOCK_SLOT'
  }

  if (state.phase === 'MAP') {
    return action.type === 'MAP/START_COMBAT'
  }

  if (state.phase === 'COMBAT_PLAYER_READY') {
    return (
      action.type === 'COMBAT/SELECT_TARGET' || action.type === 'COMBAT/PLAY_CARD' || action.type === 'COMBAT/END_TURN'
    )
  }

  if (state.phase === 'COMBAT_SELECT_HAND_CARD') {
    return (
      action.type === 'COMBAT/CANCEL_HAND_SELECTION' ||
      action.type === 'COMBAT/PICK_HAND_SELECTION_CARD' ||
      action.type === 'COMBAT/SUBMIT_HAND_SELECTION'
    )
  }

  if (state.phase === 'REWARD') {
    const rw = state.cardReward
    if (!rw) return false
    if (action.type === 'REWARD/PICK_GOLD') return rw.goldEarned > 0 && !rw.goldPickedUp
    if (action.type === 'REWARD/PICK_KEYS') return rw.keysEarned > 0 && !rw.keysPickedUp
    if (!isRewardLootFullyCollected(rw)) return false
    if (rw.kind === 'RELIC') return action.type === 'REWARD/PICK_RELIC'
    return action.type === 'REWARD/PICK_CARD'
  }

  if (state.phase === 'REST') {
    return action.type === 'REST/CONTINUE'
  }

  if (state.phase === 'TREASURE_ROOM') {
    return action.type === 'TREASURE_ROOM/PICK_RELIC'
  }

  if (state.phase === 'SHOP') {
    return action.type === 'SHOP/LEAVE' || action.type === 'SHOP/BUY_ITEM'
  }

  if (state.phase === 'GEMSTONE_CAVERN') {
    const socketing = state.gemstoneCavern?.socketing
    if (socketing) {
      return (
        action.type === 'GEMSTONE_CAVERN/SKIP_SOCKETING' ||
        action.type === 'GEMSTONE_CAVERN/SELECT_SOCKET_CARD' ||
        action.type === 'GEMSTONE_CAVERN/CONFIRM_SOCKETING'
      )
    }
    return action.type === 'GEMSTONE_CAVERN/PICK_GEM' || action.type === 'GEMSTONE_CAVERN/PROCEED'
  }

  if (state.phase === 'DEFEAT' || state.phase === 'GAME_WIN') {
    return action.type === 'TITLE/MAIN_MENU'
  }

  if (state.phase === 'ANIMATING' || state.phase === 'COMBAT_RESOLVING') {
    // Intents may be queued here, but not executed.
    return false
  }

  return false
}

