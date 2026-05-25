import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { PathCombatPreview } from '../../core/types/state'
import type { PathId } from '../../core/types/ids'
import { Paths } from '../../data/paths'
import { Enemies } from '../../data/enemies'
import { EnemyBoons } from '../../data/enemyBoons'
import { isCombatPath } from '../../systems/paths/rollPathCombat'
import { plainGreyBackdrop } from '../assets/backdropImages'
import { mapBackground } from '../assets/displayImages'
import { useRelicTravel } from '../RelicTravelContext'
import { pathIrisCenterFromDoor } from '../pathIrisCenter'
import { pathIrisSecondPathDelayMs } from '../pathIrisConfig'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { EnemyBoonHoverHost } from '../primitives/EnemyBoonHoverHost'
import { IrisOverlay, type IrisCenter } from '../primitives/IrisOverlay'
import { PathDoor } from '../primitives/PathDoor'
import { pathDoorArt, pathDoorGlowTone, pathOpenDoorArt } from '../pathDoorArt'
import type { ScreenProps } from './types'

function pathDoorCaption(pathId: PathId, combatPreview: PathCombatPreview | null): ReactNode {
  const p = Paths[pathId]
  if (isCombatPath(pathId) && combatPreview) {
    return <PathCombatPreviewCaption preview={combatPreview} />
  }
  return p?.name ?? pathId
}

function PathCombatPreviewCaption(props: Readonly<{ preview: PathCombatPreview }>) {
  const { preview } = props
  const tmpl = Enemies[preview.enemyTemplateId]
  const level = tmpl?.level ?? 0
  const name = tmpl?.name ?? preview.enemyTemplateId
  const boonLine = preview.boons
    .map((b) => EnemyBoons[b]?.name ?? '')
    .filter((s) => !!s)
    .join(' ')

  return (
    <EnemyBoonHoverHost
      boonIds={preview.boons}
      className={
        preview.boons.length
          ? 'pathCombatPreview pathCombatPreview--hasBoons'
          : 'pathCombatPreview'
      }
    >
      <span className="pathCombatPreview__level">Lv. {level}</span>
      {boonLine ? <span className="pathCombatPreview__boons">{boonLine}</span> : null}
      <span className="pathCombatPreview__name">{name}</span>
    </EnemyBoonHoverHost>
  )
}

type PathIrisPhase = 'color-out' | 'hold' | 'clear-out'

type PathIrisState = Readonly<{
  center: IrisCenter
  phase: PathIrisPhase
}>

type PendingPathChoose = Readonly<{
  pathId: PathId
  slotIndex: number
}>

export function PathScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const { stageLayerRef } = useRelicTravel()
  const offered = state.pathSelection?.offered ?? []
  const [openingSlot, setOpeningSlot] = useState<number | null>(null)
  const [pathIris, setPathIris] = useState<PathIrisState | null>(null)
  const pendingChooseRef = useRef<PendingPathChoose | null>(null)
  const clearOutDelayTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clearOutDelayTimerRef.current != null) window.clearTimeout(clearOutDelayTimerRef.current)
    }
  }, [])

  const clearPathIris = useCallback(() => {
    if (clearOutDelayTimerRef.current != null) {
      window.clearTimeout(clearOutDelayTimerRef.current)
      clearOutDelayTimerRef.current = null
    }
    setPathIris(null)
    pendingChooseRef.current = null
    setOpeningSlot(null)
  }, [])

  const handlePathColorOutComplete = useCallback(() => {
    const pending = pendingChooseRef.current
    if (!pending) {
      clearPathIris()
      return
    }
    enqueue({ type: 'PATH/CHOOSE', pathId: pending.pathId, slotIndex: pending.slotIndex })
    setPathIris((current) => (current ? { center: current.center, phase: 'hold' } : null))
    clearOutDelayTimerRef.current = window.setTimeout(() => {
      clearOutDelayTimerRef.current = null
      setPathIris((current) =>
        current ? { center: current.center, phase: 'clear-out' } : null,
      )
    }, pathIrisSecondPathDelayMs())
  }, [clearPathIris, enqueue])

  const handlePathClearOutComplete = useCallback(() => {
    clearPathIris()
  }, [clearPathIris])

  const beginPathChoose = useCallback(
    (pathId: PathId, slotIndex: number, doorButton: HTMLElement) => {
      const stageLayer = stageLayerRef.current
      const center = stageLayer
        ? pathIrisCenterFromDoor(stageLayer, doorButton, slotIndex, offered.length)
        : null
      if (!center) {
        enqueue({ type: 'PATH/CHOOSE', pathId, slotIndex })
        return
      }
      pendingChooseRef.current = { pathId, slotIndex }
      setOpeningSlot(slotIndex)
      setPathIris({ center, phase: 'color-out' })
    },
    [enqueue, offered.length, stageLayerRef],
  )

  return (
    <>
      <div className="screenBackdrop screenBackdrop--pathSelect" aria-hidden>
        <img className="screenBackdrop__img" src={plainGreyBackdrop} alt="" draggable={false} />
      </div>
      <div className="pathMapBackground" aria-hidden>
        <img className="pathMapBackground__img" src={mapBackground} alt="" draggable={false} />
      </div>
      <CenteredPanel panelClassName="pathSelectPanel">
        <div className="pathDoorRow">
          {offered.map((id, idx) => {
            const p = Paths[id]
            const locked = state.pathSelection?.slotLocked?.[idx] ?? false
            const keys = state.player.keys
            const blockedNoKey = locked && keys <= 0
            const combatPreview = state.pathSelection?.combatPreviews?.[idx] ?? null

            const isOpening = openingSlot === idx
            const pathChoosing = openingSlot != null || pathIris != null

            return (
              <PathDoor
                key={`${id}-${idx}`}
                doorSrc={isOpening ? pathOpenDoorArt(id) : pathDoorArt(id)}
                glowTone={pathDoorGlowTone(id)}
                alt={p?.name ?? id}
                locked={locked}
                opening={isOpening}
                disabled={blockedNoKey || pathChoosing}
                className={blockedNoKey ? 'pathChoiceBlocked' : undefined}
                caption={
                  <>
                    {locked ? <span className="pathLockedBadge">LOCKED</span> : null}
                    {pathDoorCaption(id, combatPreview)}
                  </>
                }
                onClick={(doorButton) => {
                  if (blockedNoKey || pathChoosing) return
                  if (locked && keys > 0) {
                    enqueue({ type: 'PATH/UNLOCK_SLOT', slotIndex: idx })
                    return
                  }
                  if (!isCombatPath(id)) {
                    enqueue({ type: 'PATH/CHOOSE', pathId: id, slotIndex: idx })
                    return
                  }
                  beginPathChoose(id, idx, doorButton)
                }}
              />
            )
          })}
        </div>
      </CenteredPanel>
      {pathIris != null ? (
        <IrisOverlay
          key={pathIris.phase}
          variant="path"
          mode="out"
          pathMask={pathIris.phase === 'clear-out' ? 'clear' : 'color'}
          hold={pathIris.phase === 'hold'}
          center={pathIris.center}
          onComplete={
            pathIris.phase === 'color-out'
              ? handlePathColorOutComplete
              : pathIris.phase === 'clear-out'
                ? handlePathClearOutComplete
                : () => {}
          }
        />
      ) : null}
    </>
  )
}
