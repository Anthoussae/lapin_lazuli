import type { CardInstance } from '../../core/types/state'
import type { CardTemplate } from '../../data/cards'
import {
  cardDescriptionLinesForInstance,
  cardDescriptionLinesForOffer,
  formatCardInstanceDisplayName,
  formatCardName,
} from '../../ui/describe'
import { cardInstanceInkCost } from '../../systems/cards/inkCost'
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
    disabled,
    selected,
    className,
    onClick,
    staticDisplay,
  } = props

  const descriptionLines =
    inst && template
      ? cardDescriptionLinesForInstance(template, inst, power, firepowerMultiplier)
      : template && offerUpgradeApplications !== undefined
        ? cardDescriptionLinesForOffer(template, offerUpgradeApplications, power, firepowerMultiplier)
        : []

  const name =
    nameOverride ??
    (inst && template
      ? formatCardInstanceDisplayName(template, inst)
      : template && offerUpgradeApplications !== undefined
        ? formatCardName(template.name, offerUpgradeApplications)
        : inst?.templateId ?? cardInstanceId ?? '')

  const ink =
    inst && template
      ? cardInstanceInkCost(inst, template)
      : template?.cost !== null && template?.cost !== undefined
        ? template.cost
        : null
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
      descriptionLines={descriptionLines}
      disabled={disabled}
      exhausted={inst?.exhausted}
      selected={selected}
      className={className}
      onClick={onClick}
      staticDisplay={staticDisplay}
    />
  )
}
