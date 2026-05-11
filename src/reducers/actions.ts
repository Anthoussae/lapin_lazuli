import type { CardId, EnemyInstanceId, CardInstanceId, GemId, PathId, RelicId } from '../core/types/ids'

export type GameAction =
  | { type: 'BOOT/START' }
  | { type: 'BOOT/ASSETS_READY'; loaded: ReadonlyArray<string>; failed: ReadonlyArray<string> }
  | { type: 'TICK/FIXED'; frames: number } // fixed-timestep UI/animation updates
  | { type: 'INPUT/INTENT_ENQUEUE'; action: PlayerAction }
  | { type: 'INPUT/INTENT_FLUSH' }
  | PlayerAction

export type PlayerAction =
  | { type: 'TITLE/NEW_GAME' }
  | { type: 'TITLE/MAIN_MENU' }
  | { type: 'RELIC/CHOOSE_STARTER'; relicId: RelicId }
  | { type: 'PATH/CHOOSE'; pathId: PathId; slotIndex: number }
  | { type: 'PATH/UNLOCK_SLOT'; slotIndex: number }
  | { type: 'MAP/START_COMBAT' }
  | { type: 'COMBAT/SELECT_TARGET'; enemyId: EnemyInstanceId | null }
  | { type: 'COMBAT/PLAY_CARD'; cardInstanceId: CardInstanceId }
  | { type: 'COMBAT/CANCEL_HAND_SELECTION' }
  | { type: 'COMBAT/PICK_HAND_SELECTION_CARD'; cardInstanceId: CardInstanceId }
  | { type: 'COMBAT/SUBMIT_HAND_SELECTION' }
  | { type: 'COMBAT/END_TURN' }
  | { type: 'REWARD/PICK_CARD'; cardId: CardId }
  | { type: 'REWARD/PICK_RELIC'; relicId: RelicId }
  | { type: 'REST/CONTINUE' }
  | { type: 'TREASURE_ROOM/PICK_RELIC'; relicId: RelicId }
  | { type: 'TREASURE_ROOM/PROCEED' }
  | { type: 'SHOP/LEAVE' }
  | { type: 'SHOP/BUY_ITEM'; slotIndex: number }
  | { type: 'GEMSTONE_CAVERN/PROCEED' }
  | { type: 'GEMSTONE_CAVERN/PICK_GEM'; gemId: GemId }
  | { type: 'GEMSTONE_CAVERN/SKIP_SOCKETING' }
  | { type: 'GEMSTONE_CAVERN/SELECT_SOCKET_CARD'; cardInstanceId: CardInstanceId }
  | { type: 'GEMSTONE_CAVERN/CONFIRM_SOCKETING' }

export type SystemAction =
  | { type: 'SYS/ENTER_PHASE'; phase: string }
  | { type: 'SYS/ENEMY_TAKE_TURN' }
  | { type: 'SYS/BEGIN_PLAYER_TURN' }
  | { type: 'SYS/RESOLVE_ANIMATIONS' }
