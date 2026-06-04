import type { CardInstance } from '../../core/types/state'
import type { CardTemplate } from '../../data/cards'
import type { CardInstanceId } from '../../core/types/ids'
import { EMPTY_POWER_DISPLAY, type PowerDisplayContext } from '../../systems/combat/powerDisplay'
import type { CardTravelPayload } from '../CardTravelContext'
import {
  buildGameCardDisplayForInstance,
  buildGameCardDisplayForOffer,
  gameCardDisplayFromTravelPayload,
  type GameCardDisplay,
} from '../gameCardDisplay'

export type { GameCardDisplay } from '../gameCardDisplay'
import { useTriggerFxArtProps } from '../TriggerFxContext'
import { Card } from './Card'

export type GameCardViewProps = Readonly<{
  /** Pre-resolved face data (preferred when parent already built display for travel FX). */
  display?: GameCardDisplay
  template?: CardTemplate | undefined
  inst?: CardInstance
  /** Shop/reward tier count when no instance exists. */
  offerUpgradeApplications?: number
  /** Foil on shop/reward offers when no instance exists. */
  offerFoil?: boolean
  /** Pre-built face for travel / flip FX (same render path as combat and deck inspect). */
  travelPayload?: CardTravelPayload
  /** Override displayed name (e.g. sold suffix). */
  nameOverride?: string
  cardInstanceId?: string
  /** Bunny/fire/shield power and green-hat poison modifiers for effect text. */
  powerDisplay?: PowerDisplayContext
  /** Current run level; used for level-scaling card text (e.g. Bunny Summons). */
  gameLevel?: number
  /** Phoenix-feather Quill: fire spells cost 0 until the first fire spell is cast. */
  freeFirstFireSpell?: boolean
  /** Paintbrush: next spell costs 0 (all cards display as 0). */
  nextSpellCosts0?: boolean
  disabled?: boolean
  selected?: boolean
  className?: string
  onClick?: () => void
  staticDisplay?: boolean
  /** When true, this hand card can receive debuff trigger FX (e.g. Disabling boon). */
  handCardTriggerFx?: boolean
}>

function resolveGameCardDisplay(props: GameCardViewProps): GameCardDisplay | null {
  if (props.display) return props.display
  if (props.travelPayload) return gameCardDisplayFromTravelPayload(props.travelPayload)

  const {
    template,
    inst,
    offerUpgradeApplications,
    offerFoil,
    nameOverride,
    cardInstanceId,
    powerDisplay = EMPTY_POWER_DISPLAY,
    gameLevel = 1,
    freeFirstFireSpell = false,
    nextSpellCosts0 = false,
  } = props

  if (inst && template) {
    return buildGameCardDisplayForInstance(template, inst, powerDisplay, gameLevel, {
      freeFirstFireSpell,
      nextSpellCosts0,
    }, nameOverride)
  }

  if (template && offerUpgradeApplications !== undefined) {
    return buildGameCardDisplayForOffer(
      template,
      offerUpgradeApplications,
      powerDisplay,
      offerFoil === true,
      gameLevel,
    )
  }

  if (nameOverride) {
    return {
      cardId: template?.id ?? inst?.templateId,
      name: nameOverride,
      nameUpgraded: false,
      inkLabel: null,
      inkModified: false,
      descriptionLines: [],
      socketedGemId: null,
      foil: false,
      combatDisabled: false,
      exhausted: false,
    }
  }

  if (inst?.templateId ?? cardInstanceId) {
    return {
      cardId: inst?.templateId,
      name: inst?.templateId ?? cardInstanceId ?? '',
      nameUpgraded: false,
      inkLabel: null,
      inkModified: false,
      descriptionLines: [],
      socketedGemId: null,
      foil: false,
      combatDisabled: inst?.disabled === true,
      exhausted: inst?.exhausted === true,
    }
  }

  return null
}

export function GameCardView(props: GameCardViewProps) {
  const {
    cardInstanceId,
    disabled,
    selected,
    className,
    onClick,
    staticDisplay,
    handCardTriggerFx = false,
  } = props

  const handTriggerFx = useTriggerFxArtProps(
    handCardTriggerFx && cardInstanceId
      ? { kind: 'handCard', cardInstanceId: cardInstanceId as CardInstanceId }
      : null,
  )

  const display = resolveGameCardDisplay(props)
  if (!display) return null

  return (
    <Card
      cardId={display.cardId}
      name={display.name || undefined}
      nameUpgraded={display.nameUpgraded}
      inkLabel={display.inkLabel}
      inkModified={display.inkModified}
      descriptionLines={display.descriptionLines}
      disabled={disabled}
      combatDisabled={display.combatDisabled}
      exhausted={display.exhausted}
      selected={selected}
      className={[className, handTriggerFx.className].filter(Boolean).join(' ') || undefined}
      onClick={onClick}
      staticDisplay={staticDisplay}
      socketedGemId={display.socketedGemId}
      foil={display.foil}
    />
  )
}
