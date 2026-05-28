import type { EnemyBoonId } from '../../data/enemyBoons'
import { monsterSpriteForName } from '../assets/monsterSprites'
import { useTriggerFxArtProps } from '../TriggerFxContext'
import type { EnemyInstanceId } from '../../core/types/ids'
import { MonsterDefeatPoof } from './MonsterDefeatPoof'
import { CombatTargetHoverHost } from './CombatTargetHoverHost'
import { EnchantmentGlowRings, enchantmentTooltipEntries } from './EnchantmentGlowRings'

type CombatMonsterPlaceholderProps = Readonly<{
  /** Label shown beneath the placeholder art (may include boon prefix). */
  name: string
  /** Enemy template display name for sprite lookup; defaults to `name`. */
  spriteName?: string
  /** Combat enemy instance id for boon trigger FX anchoring. */
  enemyInstanceId: EnemyInstanceId
  /** Boon ids for hover tooltips. */
  boonIds?: ReadonlyArray<EnemyBoonId>
  /** Enchantment stacks (already grouped/stacked for this target). */
  enchantmentStacks?: ReadonlyArray<
    Readonly<{ key: string; templateId: string; name: string; tooltipText: string; color: string; count: number }>
  >
  /** Plays defeat fall / glow / poof FX. */
  defeating?: boolean
  className?: string
}>

export function CombatMonsterPlaceholder(props: CombatMonsterPlaceholderProps) {
  const { name, spriteName = name, enemyInstanceId, boonIds = [], enchantmentStacks = [], defeating = false, className } = props
  const src = monsterSpriteForName(spriteName)
  const triggerFx = useTriggerFxArtProps({ kind: 'enemy', enemyInstanceId })
  const hasBoons = boonIds.length > 0
  const hasEnchantments = enchantmentStacks.length > 0
  const rootClass = [
    'combatMonsterPlaceholder',
    hasBoons ? 'combatMonsterPlaceholder--hasBoons' : null,
    hasEnchantments ? 'combatMonsterPlaceholder--hasEnchantments' : null,
    defeating ? 'combatMonsterPlaceholder--defeating' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <CombatTargetHoverHost
      boonIds={boonIds}
      enchantmentEntries={enchantmentTooltipEntries(enchantmentStacks)}
      className={rootClass}
    >
      {defeating ? <MonsterDefeatPoof /> : null}
      <EnchantmentGlowRings stacks={enchantmentStacks} />
      <img
        key={triggerFx.key}
        className={['combatMonsterPlaceholder__art', triggerFx.className].filter(Boolean).join(' ')}
        src={src}
        alt=""
        draggable={false}
        aria-hidden
      />
      <div className="combatMonsterPlaceholder__name">{name}</div>
    </CombatTargetHoverHost>
  )
}
