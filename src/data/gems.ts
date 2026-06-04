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
    effects: [{ kind: 'ADD_BUNNIES', amount: 2, upgradeValue: 2 }],
  },
  EMERALD: {
    id: 'EMERALD',
    name: 'Emerald',
    effects: [{ kind: 'GAIN_SHIELD', amount: 2, upgradeValue: 2 }],
  },
  MALACHITE: {
    id: 'MALACHITE',
    name: 'Malachite',
    effects: [{ kind: 'LOCK_ALL_SHIELD' }],
  },
  RUBY: {
    id: 'RUBY',
    name: 'Ruby',
    effects: [{ kind: 'DEAL_DAMAGE', amount: 5, upgradeValue: 3 }],
  },
  SAPPHIRE: {
    id: 'SAPPHIRE',
    name: 'Sapphire',
    effects: [
      { kind: 'DRAW_CARDS', amount: 1, upgradeValue: 0.5 },
      { kind: 'EXHAUST', upgradeValue: 1 },
    ],
  },
  AMETHYST: {
    id: 'AMETHYST',
    name: 'Amethyst',
    effects: [{ kind: 'MULTIPLY_BUNNIES', amount: 1.25, upgradeValue: 0.25 }],
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
    effects: [{ kind: 'DISPEL', amount: 1, upgradeValue: 1 }],
  },
  GARNET_SHARD: {
    id: 'GARNET_SHARD',
    name: 'Garnet Shard',
    effects: [
      {
        kind: 'CRITICAL',
        chancePercent: 20,
        chanceUpgradeValue: 5,
        multiplierPercent: 150,
        multiplierUpgradeValue: 25,
      },
    ],
  },
}
