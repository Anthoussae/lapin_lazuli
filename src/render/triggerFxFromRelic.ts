import type { EnemyBoonId } from '../data/enemyBoons'
import { EnemyBoons } from '../data/enemyBoons'
import type { TriggerFxDef, TriggerFxTargetKind } from '../data/triggerFx'
import type { CardInstanceId, EnemyInstanceId, RelicId } from '../core/types/ids'
import { Relics } from '../data/relics'

export type TriggerFxRole = 'source' | 'buff' | 'debuff'

export type TriggerFxAnchor =
  | Readonly<{ kind: 'relic'; slotIndex: number }>
  | Readonly<{ kind: 'enemy'; enemyInstanceId: EnemyInstanceId }>
  | Readonly<{ kind: 'playerLockedShield' }>
  | Readonly<{ kind: 'playerShield' }>
  | Readonly<{ kind: 'cauldron' }>
  | Readonly<{ kind: 'inkJar' }>
  | Readonly<{ kind: 'deck' }>
  | Readonly<{ kind: 'handCard'; cardInstanceId: CardInstanceId }>

export type TriggerFxFlash = Readonly<{
  anchor: TriggerFxAnchor
  role: TriggerFxRole
}>

export function triggerFxAnchorKey(anchor: TriggerFxAnchor): string {
  switch (anchor.kind) {
    case 'relic':
      return `relic:${anchor.slotIndex}`
    case 'enemy':
      return `enemy:${anchor.enemyInstanceId}`
    case 'playerLockedShield':
      return 'playerLockedShield'
    case 'playerShield':
      return 'playerShield'
    case 'cauldron':
      return 'cauldron'
    case 'inkJar':
      return 'inkJar'
    case 'deck':
      return 'deck'
    case 'handCard':
      return `handCard:${anchor.cardInstanceId}`
  }
}

function anchorForTargetKind(kind: TriggerFxTargetKind): TriggerFxAnchor {
  return { kind }
}

function flashesFromTriggerFx(source: TriggerFxFlash, triggerFx: TriggerFxDef): ReadonlyArray<TriggerFxFlash> {
  const targets = (triggerFx.targets ?? []).map(
    (t): TriggerFxFlash => ({
      anchor: anchorForTargetKind(t.kind),
      role: t.role,
    }),
  )
  if (!targets.length) return [source]
  return [source, ...targets]
}

/** Flashes for a relic trigger: source on the belt slot + any declared buff/debuff targets. */
export function flashesForRelicTrigger(
  relics: ReadonlyArray<{ templateId: RelicId }>,
  relicId: RelicId,
  triggerId: string,
): ReadonlyArray<TriggerFxFlash> | null {
  const slotIndex = relics.findIndex((r) => r.templateId === relicId)
  if (slotIndex < 0) return null

  const tmpl = Relics[relicId]
  const trig = tmpl?.triggers.find((t) => t.id === triggerId)
  if (!trig?.triggerFx) return null

  return flashesFromTriggerFx({ anchor: { kind: 'relic', slotIndex }, role: 'source' }, trig.triggerFx)
}

/** Flashes for a boon trigger: source on the enemy icon + any declared buff/debuff targets. */
export function flashesForBoonTrigger(
  enemies: Readonly<{
    enemyById: Readonly<Record<string, Readonly<{ boons: ReadonlyArray<EnemyBoonId> }>>>
  }>,
  enemyId: EnemyInstanceId,
  boonId: EnemyBoonId,
  triggerId: string,
  targetCardInstanceIds: ReadonlyArray<CardInstanceId> = [],
): ReadonlyArray<TriggerFxFlash> | null {
  const enemy = enemies.enemyById[enemyId]
  if (!enemy?.boons.includes(boonId)) return null

  const tmpl = EnemyBoons[boonId]
  const trig = tmpl?.triggers?.find((t) => t.id === triggerId)
  if (!trig?.triggerFx) return null

  const base = flashesFromTriggerFx({ anchor: { kind: 'enemy', enemyInstanceId: enemyId }, role: 'source' }, trig.triggerFx)
  const handTargets = targetCardInstanceIds.map(
    (cardInstanceId): TriggerFxFlash => ({
      anchor: { kind: 'handCard', cardInstanceId },
      role: 'debuff',
    }),
  )
  return [...base, ...handTargets]
}
