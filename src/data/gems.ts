import type { GemId } from '../core/types/ids'
import type { Effect } from './effects'

export type GemTemplate = Readonly<{
  id: GemId
  name: string
  effects: ReadonlyArray<Effect>
  /**
   * When true, this gem may only be socketed onto cards that do not already have destiny
   * (template or prior gem). Used for Topaz so destiny cannot be stacked.
   */
  requiresTargetWithoutDestiny?: boolean
}>

export const Gems: Readonly<Record<GemId, GemTemplate>> = {
  LAPIS_LAZULI: {
    id: 'LAPIS_LAZULI',
    name: 'Lapis Lazuli',
    effects: [{ kind: 'ADD_BUNNIES', amount: 3 }],
  },
  EMERALD: {
    id: 'EMERALD',
    name: 'Emerald',
    effects: [{ kind: 'GAIN_SHIELD', amount: 4 }],
  },
  MALACHITE: {
    id: 'MALACHITE',
    name: 'Malachite',
    effects: [{ kind: 'LOCK_ALL_SHIELD' }],
  },
  RUBY: {
    id: 'RUBY',
    name: 'Ruby',
    effects: [{ kind: 'DEAL_DAMAGE', amount: 5 }],
  },
  SAPPHIRE: {
    id: 'SAPPHIRE',
    name: 'Sapphire',
    effects: [{ kind: 'DRAW_CARDS', amount: 1 }],
  },
  AMETHYST: {
    id: 'AMETHYST',
    name: 'Amethyst',
    effects: [{ kind: 'MULTIPLY_BUNNIES', amount: 1.5 }],
  },
  TOPAZ: {
    id: 'TOPAZ',
    name: 'Topaz',
    requiresTargetWithoutDestiny: true,
    effects: [{ kind: 'DESTINY' }],
  },
  // COAL: {
  //   id: 'COAL',
  //   name: 'Coal',
  //   effects: [{ kind: 'CONSUME' }],
  // },
  DIAMOND: {
    id: 'DIAMOND',
    name: 'Diamond',
    effects: [{ kind: 'UPGRADE_AFTER_CASTING' }, { kind: 'EXHAUST' }],
  },
}
