import { useRef } from 'react'
import type { EnemyBoonId } from '../../data/enemyBoons'
import { monsterSpriteForFilename } from '../assets/monsterSprites'
import { useRecoloredImageSrc } from '../hooks/useRecoloredImageSrc'
import { useTriggerFxArtProps } from '../TriggerFxContext'
import type { EnemyInstanceId } from '../../core/types/ids'
import { MonsterDefeatPoof } from './MonsterDefeatPoof'
import { CombatTargetHoverHost } from './CombatTargetHoverHost'
import {
  EnchantmentVisuals,
  enchantmentTooltipEntries,
  hasFireCrownEnchantmentOverlay,
  type EnchantmentStackDisplay,
} from './EnchantmentGlowRings'

type CombatMonsterPlaceholderProps = Readonly<{
  /** Label shown beneath the placeholder art (may include boon prefix). */
  name: string
  /** PNG filename from the enemy template's `sprite` field. */
  sprite?: string
  /** Hex tint for dark sprite line art (`#rrggbb`); omit for default black art. */
  color?: string
  /** Combat enemy instance id for boon trigger FX anchoring. */
  enemyInstanceId: EnemyInstanceId
  /** Boon ids for hover tooltips. */
  boonIds?: ReadonlyArray<EnemyBoonId>
  /** Enemy template level for level-scaled boon tooltips. */
  enemyLevel?: number
  /** Current strength stacks for hover tooltip. */
  strength?: number
  /** Enchantment stacks (already grouped/stacked for this target). */
  enchantmentStacks?: ReadonlyArray<EnchantmentStackDisplay>
  /** Plays defeat fall / glow / poof FX. */
  defeating?: boolean
  /** Registers anchor for critical hit FX on the targeted enemy. */
  registerCriticalAnchor?: (el: HTMLElement | null) => void
  /** Registers anchor for poison card HP_LOSS hit FX. */
  registerPoisonCardHitAnchor?: (el: HTMLElement | null) => void
  /** Registers anchor for fire damage hit FX. */
  registerFireDamageHitAnchor?: (el: HTMLElement | null) => void
  criticalShake?: Readonly<{ className: string; key: number }>
  className?: string
}>

export function CombatMonsterPlaceholder(props: CombatMonsterPlaceholderProps) {
  const {
    name,
    sprite,
    color,
    enemyInstanceId,
    boonIds = [],
    enemyLevel = 0,
    strength = 0,
    enchantmentStacks = [],
    defeating = false,
    registerCriticalAnchor,
    registerPoisonCardHitAnchor,
    registerFireDamageHitAnchor,
    criticalShake,
    className,
  } = props
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const baseSrc = monsterSpriteForFilename(sprite)
  const src = useRecoloredImageSrc(baseSrc, sprite != null ? color : undefined)
  const triggerFx = useTriggerFxArtProps({ kind: 'enemy', enemyInstanceId })
  const hasBoons = boonIds.length > 0
  const hasEnchantments = enchantmentStacks.length > 0
  const nameWords = name.split(' ').filter(Boolean)
  const wrapName = boonIds.length >= 2 && nameWords.length > 2
  const smallName = name.length >= 22
  const rootClass = [
    'combatMonsterPlaceholder',
    hasBoons ? 'combatMonsterPlaceholder--hasBoons' : null,
    hasEnchantments ? 'combatMonsterPlaceholder--hasEnchantments' : null,
    hasFireCrownEnchantmentOverlay(enchantmentStacks) ? 'combatMonsterPlaceholder--fireCrownAboveBar' : null,
    defeating ? 'combatMonsterPlaceholder--defeating' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const nameNode = wrapName ? (
    <>
      {nameWords.slice(0, 2).join(' ')}
      <br />
      {nameWords.slice(2).join(' ')}
    </>
  ) : (
    name
  )

  return (
    <CombatTargetHoverHost
      boonIds={boonIds}
      enemyLevel={enemyLevel}
      strength={strength}
      enchantmentEntries={enchantmentTooltipEntries(enchantmentStacks)}
      className={rootClass}
    >
      <div
        ref={(el) => {
          anchorRef.current = el
          registerCriticalAnchor?.(el)
          registerPoisonCardHitAnchor?.(el)
          registerFireDamageHitAnchor?.(el)
        }}
        className="combatPlaceholderAnchor"
      >
        {defeating ? <MonsterDefeatPoof /> : null}
        <img
          key={`${triggerFx.key}-${criticalShake?.key ?? 0}`}
          className={[
            'combatMonsterPlaceholder__art',
            triggerFx.className,
            criticalShake?.className,
          ]
            .filter(Boolean)
            .join(' ')}
          src={src}
          alt=""
          draggable={false}
          aria-hidden
        />
        <EnchantmentVisuals
          stacks={enchantmentStacks}
          anchorRef={anchorRef}
          spriteTriggerTarget={{ kind: 'enemy', enemyInstanceId }}
        />
      </div>
      <div
        className={[
          'combatMonsterPlaceholder__name',
          wrapName ? 'combatMonsterPlaceholder__name--wrap' : null,
          smallName ? 'combatMonsterPlaceholder__name--small' : null,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {nameNode}
      </div>
    </CombatTargetHoverHost>
  )
}
