import type { CardInstance } from '../../core/types/state'
import type { CardTemplate } from '../../data/cards'
import {
  cardDescriptionLinesForInstance,
  cardDescriptionLinesForOffer,
  formatCardInstanceDisplayName,
  formatCardName,
} from '../../ui/describe'
import { cardInstanceInkCost, cardInstanceInkCostModified } from '../../systems/cards/inkCost'
import { Card } from './Card'

export type GameCardViewProps = Readonly<{
  template: CardTemplate | undefined
  inst?: CardInstance
  /** Shop/reward tier count when no instance exists. */
  offerUpgradeApplications?: number
  /** Override displayed name (e.g. sold suffix). */
  nameOverride?: string
  cardInstanceId?: string
  power?: number
  firepowerMultiplier?: number
  shieldPower?: number
  /** Phoenix-feather Quill: fire spells cost 0 until the first fire spell is cast. */
  freeFirstFireSpell?: boolean
  disabled?: boolean
  selected?: boolean
  className?: string
  onClick?: () => void
  staticDisplay?: boolean
}>

export function GameCardView(props: GameCardViewProps) {
  const {
    template,
    inst,
    offerUpgradeApplications,
    nameOverride,
    cardInstanceId,
    power = 0,
    firepowerMultiplier = 0,
    shieldPower = 0,
    freeFirstFireSpell = false,
    disabled,
    selected,
    className,
    onClick,
    staticDisplay,
  } = props

  const descriptionLines =
    inst && template
      ? cardDescriptionLinesForInstance(template, inst, power, firepowerMultiplier, shieldPower)
      : template && offerUpgradeApplications !== undefined
        ? cardDescriptionLinesForOffer(template, offerUpgradeApplications, power, firepowerMultiplier, shieldPower)
        : []

  const name =
    nameOverride ??
    (inst && template
      ? formatCardInstanceDisplayName(template, inst)
      : template && offerUpgradeApplications !== undefined
        ? formatCardName(template.name, offerUpgradeApplications)
        : inst?.templateId ?? cardInstanceId ?? '')

  const inkOpts = { freeFirstFireSpell }
  const ink =
    inst && template
      ? cardInstanceInkCost(inst, template, inkOpts)
      : template?.cost !== null && template?.cost !== undefined
        ? template.cost
        : null
  const inkModified =
    inst && template ? cardInstanceInkCostModified(inst, template, inkOpts) : false
  const inkLabel = inst?.exhausted ? 'Exhausted' : ink !== null ? String(ink) : null

  const nameUpgraded =
    inst != null ? inst.upgrades > 0 : offerUpgradeApplications !== undefined ? offerUpgradeApplications > 0 : false

  const cardId = template?.id ?? inst?.templateId

  return (
    <Card
      cardId={cardId}
      name={name || undefined}
      nameUpgraded={nameUpgraded}
      inkLabel={inkLabel}
      inkModified={inkModified}
      descriptionLines={descriptionLines}
      disabled={disabled}
      exhausted={inst?.exhausted}
      selected={selected}
      className={className}
      onClick={onClick}
      staticDisplay={staticDisplay}
      socketedGemId={inst?.socketedGemId ?? null}
      foil={inst?.foil === true}
    />
  )
}
