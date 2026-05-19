import type { ReactNode } from 'react'
import type { PathCombatPreview } from '../../core/types/state'
import type { PathId } from '../../core/types/ids'
import { Paths } from '../../data/paths'
import { Enemies } from '../../data/enemies'
import { EnemyBoons } from '../../data/enemyBoons'
import { isCombatPath } from '../../systems/paths/rollPathCombat'
import { mapBackground } from '../assets/displayImages'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { PathDoor } from '../primitives/PathDoor'
import { pathDoorArt, pathDoorGlowTone } from '../pathDoorArt'
import type { ScreenProps } from './types'

function pathDoorCaption(pathId: PathId, combatPreview: PathCombatPreview | null): ReactNode {
  const p = Paths[pathId]
  if (isCombatPath(pathId) && combatPreview) {
    return <span className="pathCombatPreview">{pathCombatPreviewLabel(combatPreview)}</span>
  }
  return p?.name ?? pathId
}

function pathCombatPreviewLabel(preview: PathCombatPreview): string {
  const tmpl = Enemies[preview.enemyTemplateId]
  const boonPrefix = preview.boons
    .map((b) => EnemyBoons[b]?.name ?? '')
    .filter((s) => !!s)
    .join(' ')
  const name = tmpl?.name ?? preview.enemyTemplateId
  const full = boonPrefix ? `${boonPrefix} ${name}` : name
  return `${full}, HP: ${preview.maxHp}`
}

export function PathScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const offered = state.pathSelection?.offered ?? []

  return (
    <>
      <div className="pathMapBackground" aria-hidden>
        <img className="pathMapBackground__img" src={mapBackground} alt="" draggable={false} />
      </div>
      <CenteredPanel title="Choose a path:" panelClassName="pathSelectPanel">
      <div className="pathDoorRow">
        {offered.map((id, idx) => {
          const p = Paths[id]
          const locked = state.pathSelection?.slotLocked?.[idx] ?? false
          const keys = state.player.keys
          const blockedNoKey = locked && keys <= 0
          const combatPreview = state.pathSelection?.combatPreviews?.[idx] ?? null

          return (
            <PathDoor
              key={`${id}-${idx}`}
              doorSrc={pathDoorArt(id)}
              glowTone={pathDoorGlowTone(id)}
              alt={p?.name ?? id}
              locked={locked}
              disabled={blockedNoKey}
              className={blockedNoKey ? 'pathChoiceBlocked' : undefined}
              caption={
                <>
                  {locked ? <span className="pathLockedBadge">LOCKED</span> : null}
                  {pathDoorCaption(id, combatPreview)}
                </>
              }
              onClick={() => {
                if (blockedNoKey) return
                if (locked && keys > 0) {
                  enqueue({ type: 'PATH/UNLOCK_SLOT', slotIndex: idx })
                  return
                }
                enqueue({ type: 'PATH/CHOOSE', pathId: id, slotIndex: idx })
              }}
            />
          )
        })}
      </div>
    </CenteredPanel>
    </>
  )
}
