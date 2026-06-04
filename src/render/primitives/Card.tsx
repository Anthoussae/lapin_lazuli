import { useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import type { CardId, GemId } from '../../core/types/ids'
import { isPotionCardId } from '../../data/cards'
import type { CardDescLine } from '../../ui/describe'
import { collectKeywordIdsFromDescriptionLines } from '../../ui/cardKeywords'
import { cardBackArt, cardFrontArtForGem } from '../assets/cardImages'
import { gemImageSrc } from '../assets/gemImages'
import { renderCardIllustration } from '../cardIllustrationLayout'
import { CardName, cardTypographyLayoutStyle } from '../cardTypographyLayout'
import { CardDesc } from './CardDesc'
import { KeywordTooltips, keywordTooltipsViewportPosition } from './KeywordTooltips'
import { useCardFontScale } from './useCardFontScale'

export type CardFace = 'front' | 'back'

export type CardProps = Readonly<{
  face?: CardFace
  name?: string
  /** Dark green name when the card has upgrade counters. */
  nameUpgraded?: boolean
  /** Top-right ink label (e.g. "2", "Exhausted"). Omit when not applicable. */
  inkLabel?: string | null
  /** Green ink when cost differs from printed (e.g. relic discount). */
  inkModified?: boolean
  descriptionLines?: ReadonlyArray<CardDescLine>
  /** Plain multiline card text (legacy / travel flyer). Ignored when descriptionLines is set. */
  description?: string
  /** Template id — resolves illustration art when `illustration` is omitted. */
  cardId?: CardId
  illustration?: ReactNode
  /** When true, card uses exhausted visuals and cannot be cast this combat (Disabling boon). */
  combatDisabled?: boolean
  disabled?: boolean
  exhausted?: boolean
  selected?: boolean
  className?: string
  onClick?: () => void
  /** Skip dynamic font fitting (e.g. card pickup flyer). */
  staticDisplay?: boolean
  /** When set, selects gem-tinted front frame and renders the gem icon. */
  socketedGemId?: GemId | null
  /** Printer foil — rainbow sheen and hover tooltip on the front face. */
  foil?: boolean
}>

function plainDescription(description: string): ReactNode {
  const lines = description.split('\n').filter((line) => line.length > 0)
  if (!lines.length) return null
  return (
    <div className="gameCard__desc gameCard__desc--plain">
      {lines.map((line, i) => (
        <div key={i} className="gameCard__descLine">
          {line}
        </div>
      ))}
    </div>
  )
}

export function Card(props: CardProps) {
  const {
    face = 'front',
    name,
    nameUpgraded,
    inkLabel,
    inkModified,
    descriptionLines,
    description,
    cardId,
    illustration,
    disabled,
    combatDisabled,
    exhausted,
    selected,
    className,
    onClick,
    staticDisplay = false,
    socketedGemId = null,
    foil = false,
  } = props

  const clickable = onClick != null
  const socketed = socketedGemId != null
  const gemImage = socketed ? gemImageSrc(socketedGemId) : undefined
  const showInk = inkLabel != null && inkLabel !== ''
  const contentKey = useMemo(
    () =>
      [
        face,
        name ?? '',
        cardId ?? '',
        inkLabel ?? '',
        description ?? '',
        descriptionLines
          ?.map((l) =>
            l.kind === 'plain'
              ? l.text
              : l.kind === 'keywords'
                ? l.ids.join(',')
                : l.segments
                    .map((s) => (s.kind === 'text' ? s.text : `${s.base}:${s.display}`))
                    .join(''),
          )
          .join('|') ?? '',
      ].join('\0'),
    [face, name, inkLabel, description, descriptionLines],
  )
  const typographyStyle = useMemo(() => cardTypographyLayoutStyle(cardId), [cardId])
  const { cardRef, overlayRef } = useCardFontScale(face === 'front' && !staticDisplay, contentKey)
  const keywordIds = useMemo(
    () => (descriptionLines ? collectKeywordIdsFromDescriptionLines(descriptionLines) : []),
    [descriptionLines],
  )
  const showHoverTooltips =
    face === 'front' && !staticDisplay && (foil || keywordIds.length > 0)
  const [hoverTip, setHoverTip] = useState<null | { x: number; y: number }>(null)

  const placeHoverTooltip = (e: MouseEvent<HTMLDivElement>) => {
    if (!showHoverTooltips) return
    setHoverTip(keywordTooltipsViewportPosition(e.currentTarget))
  }

  const clearHoverTooltip = () => setHoverTip(null)

  const descriptionContent =
    descriptionLines && descriptionLines.length > 0 ? (
      <CardDesc lines={descriptionLines} />
    ) : description ? (
      plainDescription(description)
    ) : null

  const showExhaustedStyle = (exhausted || combatDisabled) && face === 'front'
  const showClickDisabled = disabled && !combatDisabled

  const classes = [
    'gameCard',
    foil && face === 'front' ? 'gameCard--foil' : null,
    socketed ? 'gameCard--socketed' : null,
    isPotionCardId(cardId) ? 'gameCard--potion' : null,
    clickable ? 'gameCard--clickable' : null,
    showClickDisabled ? 'gameCard--disabled' : null,
    combatDisabled && face === 'front' ? 'gameCard--combatDisabled' : null,
    selected ? 'gameCard--selected' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const faceClasses = ['gameCard__face', showExhaustedStyle ? 'gameCard--exhausted' : null]
    .filter(Boolean)
    .join(' ')

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!clickable || disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <>
      <div
        ref={cardRef}
        className={classes}
        style={typographyStyle}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable && !disabled ? 0 : undefined}
        aria-disabled={clickable && disabled ? true : undefined}
        onMouseEnter={showHoverTooltips ? placeHoverTooltip : undefined}
        onMouseLeave={showHoverTooltips ? clearHoverTooltip : undefined}
        onClick={() => {
          if (!clickable || disabled) return
          onClick()
        }}
        onKeyDown={handleKeyDown}
      >
      {face === 'back' ? (
        <img
          className="gameCard__frame"
          src={cardBackArt}
          alt=""
          draggable={false}
        />
      ) : (
        <>
          <div className={faceClasses}>
            <img
              className={['gameCard__frame', 'gameCard__frame--front'].join(' ')}
              src={cardFrontArtForGem(socketedGemId, cardId)}
              alt=""
              draggable={false}
            />
            {foil ? <div className="gameCard__foilSheen" aria-hidden /> : null}
            {gemImage ? (
              <img className="gameCard__gem" src={gemImage} alt="" draggable={false} />
            ) : null}
            <div ref={overlayRef} className="gameCard__overlay">
              <div
                className={['gameCard__header', showInk ? 'gameCard__header--hasInk' : null]
                  .filter(Boolean)
                  .join(' ')}
              >
                {name ? <CardName name={name} upgraded={nameUpgraded} /> : null}
                {showInk ? (
                  <div
                    className={['gameCard__ink', inkModified ? 'gameCard__ink--modified' : null]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={inkLabel === 'Exhausted' ? 'Exhausted' : `Ink cost ${inkLabel}`}
                  >
                    {inkLabel}
                  </div>
                ) : null}
              </div>
              <div className="gameCard__art" aria-hidden>
                {illustration ?? renderCardIllustration(cardId)}
              </div>
              {descriptionContent}
            </div>
          </div>
          {combatDisabled ? (
            <div className="gameCard__disabledStamp" aria-hidden>
              DISABLED
            </div>
          ) : null}
        </>
      )}
      </div>
      {hoverTip ? (
        <KeywordTooltips ids={keywordIds} foil={foil} x={hoverTip.x} y={hoverTip.y} />
      ) : null}
    </>
  )
}
