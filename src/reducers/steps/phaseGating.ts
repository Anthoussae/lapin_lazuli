import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../actions'
import { canTakeCombatPlayerInput, isCombatResolvePending } from '../../systems/combat/combatInput'
import { isRewardLootFullyCollected } from '../../systems/rewards/rewardLoot'
import { mysteryRoomIsEvent } from '../../data/mysteryRooms'
import { collectorCanProceed } from '../../systems/events/collector'

export function isActionLegalNow(state: GameState, action: PlayerAction): boolean {
  if (state.phase === 'BOOT') return false

  if (action.type.startsWith('COMBAT/') && isCombatResolvePending(state)) {
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
    if (!canTakeCombatPlayerInput(state)) return false
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
    const rest = state.restOutcome
    if (action.type === 'REST/SLEEP' || action.type === 'REST/STUDY') {
      return rest != null && !rest.slept && !rest.studied
    }
    if (action.type === 'REST/CONTINUE') return rest != null && (rest.slept || rest.studied)
    return false
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

  if (state.phase === 'EVENT') {
    const roomId = state.mysteryRoom?.roomId
    if (!roomId || !mysteryRoomIsEvent(roomId)) return false
    if (roomId === 'FONT_OF_LETHE') {
      const fol = state.mysteryRoom?.fontOfLethe
      if (action.type === 'FONT_OF_LETHE/SELECT_CARD' || action.type === 'FONT_OF_LETHE/FORGET') {
        return fol != null && !fol.cardForgotten
      }
      if (action.type === 'EVENT/PROCEED') return fol?.cardForgotten === true
      return false
    }
    if (roomId === 'PRINTER') {
      const printer = state.mysteryRoom?.printer
      const choiceOpen = printer != null && !printer.cardFoiled && !printer.cardDuplicated
      if (
        action.type === 'PRINTER/SELECT_CARD' ||
        action.type === 'PRINTER/FOIL' ||
        action.type === 'PRINTER/SELECT_DUPLICATE_CARD' ||
        action.type === 'PRINTER/DUPLICATE'
      ) {
        return choiceOpen
      }
      if (action.type === 'EVENT/PROCEED') {
        return printer?.cardFoiled === true || printer?.cardDuplicated === true
      }
      return false
    }
    if (roomId === 'COLLECTOR') {
      const collector = state.mysteryRoom?.collector
      if (action.type === 'COLLECTOR/REVEAL_OFFERED_CARD') {
        return collector?.cardRevealed !== true
      }
      if (action.type === 'COLLECTOR/SELL') {
        return (
          collector?.cardRevealed === true &&
          collector.sold !== true &&
          collector.bulkAccepted !== true &&
          collector.offeredCardInstanceId != null
        )
      }
      if (action.type === 'COLLECTOR/ACCEPT_BULK') {
        return collector?.cardRevealed === true && collector.sold !== true && collector.bulkAccepted !== true
      }
      if (action.type === 'COLLECTOR/ADD_BULK_CARD') {
        const cards = collector?.bulkCards
        return (
          collector?.bulkAccepted === true &&
          cards != null &&
          action.index >= 0 &&
          action.index < cards.length &&
          action.index === collector.bulkCardsAdded
        )
      }
      if (action.type === 'EVENT/PROCEED') return collectorCanProceed(state)
      return false
    }
    return action.type === 'EVENT/PROCEED'
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

