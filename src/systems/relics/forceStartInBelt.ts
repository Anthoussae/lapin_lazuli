import type { RelicId } from '../../core/types/ids'
import type { GameState } from '../../core/types/state'
import { Relics } from '../../data/relics'
import { mkRelicInstance } from '../factories'
import { applyRelicTriggers } from './triggers'

const FORCE_START_IN_BELT_IDS: ReadonlyArray<RelicId> = (Object.keys(Relics) as RelicId[]).filter(
  (id) => Relics[id]?.forceStartInBelt === true,
)

/** Grants every relic with {@link RelicTemplate.forceStartInBelt} and fires `onPickup` triggers. */
export function applyForceStartInBeltRelics(state: GameState): GameState {
  let s = state
  for (const relicId of FORCE_START_IN_BELT_IDS) {
    const tmpl = Relics[relicId]
    if (!tmpl) continue
    if (tmpl.unique && s.player.relics.some((r) => r.templateId === relicId)) continue

    const nextIdx = s.player.relics.length + 1
    const inst = mkRelicInstance(`rb${nextIdx}`, relicId)
    s = {
      ...s,
      player: { ...s.player, relics: [...s.player.relics, inst] },
      runStats: { ...s.runStats, relicsObtained: s.runStats.relicsObtained + 1 },
    }
    s = applyRelicTriggers(s, relicId, 'onPickup')
  }
  return s
}
