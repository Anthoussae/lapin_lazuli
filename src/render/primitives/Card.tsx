import { useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import type { CardDescLine } from '../../ui/describe'
import { collectKeywordIdsFromDescriptionLines } from '../../ui/cardKeywords'
import {
  cardBackArt,
  cardFrontArt,
  cardIllustrationPlaceholder,
} from '../assets/cardImages'
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
  descriptionLines?: ReadonlyArray<CardDescLine>
  /** Plain multiline card text (legacy / travel flyer). Ignored when descriptionLines is set. */
  description?: string
  illustration?: ReactNode
  disabled?: boolean
  exhausted?: boolean
  selected?: boolean
  className?: string
  onClick?: () => void
  /** Skip dynamic font fitting (e.g. card pickup flyer). */
  staticDisplay?: boolean
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
    descriptionLines,
    description,
    illustration,
    disabled,
    exhausted,
    selected,
    className,
    onClick,
    staticDisplay = false,
  } = props

  const clickable = onClick != null
  const showInk = inkLabel != null && inkLabel !== ''
  const contentKey = useMemo(
    () =>
      [
        face,
        name ?? '',
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
  const { cardRef, overlayRef } = useCardFontScale(face === 'front' && !staticDisplay, contentKey)
  const keywordIds = useMemo(
    () => (descriptionLines ? collectKeywordIdsFromDescriptionLines(descriptionLines) : []),
    [descriptionLines],
  )
  const showKeywordTooltips = face === 'front' && !staticDisplay && keywordIds.length > 0
  const [keywordTip, setKeywordTip] = useState<null | { x: number; y: number }>(null)

  const placeKeywordTooltip = (e: MouseEvent<HTMLDivElement>) => {
    if (!showKeywordTooltips) return
    setKeywordTip(keywordTooltipsViewportPosition(e.currentTarget.getBoundingClientRect()))
  }

  const clearKeywordTooltip = () => setKeywordTip(null)

  const descriptionContent =
    descriptionLines && descriptionLines.length > 0 ? (
      <CardDesc lines={descriptionLines} />
    ) : description ? (
      plainDescription(description)
    ) : null

  const classes = [
    'gameCard',
    clickable ? 'gameCard--clickable' : null,
    disabled ? 'gameCard--disabled' : null,
    exhausted && face === 'front' ? 'gameCard--exhausted' : null,
    selected ? 'gameCard--selected' : null,
    className,
  ]
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
        role={clickable ? 'button' : undefined}
        tabIndex={clickable && !disabled ? 0 : undefined}
        aria-disabled={clickable && disabled ? true : undefined}
        onMouseEnter={showKeywordTooltips ? placeKeywordTooltip : undefined}
        onMouseMove={showKeywordTooltips ? placeKeywordTooltip : undefined}
        onMouseLeave={showKeywordTooltips ? clearKeywordTooltip : undefined}
        onClick={() => {
          if (!clickable || disabled) return
          onClick()
        }}
        onKeyDown={handleKeyDown}
      >
      <img
        className="gameCard__frame"
        src={face === 'back' ? cardBackArt : cardFrontArt}
        alt=""
        draggable={false}
      />
      {face === 'front' ? (
        <div ref={overlayRef} className="gameCard__overlay">
          <div className="gameCard__header">
            {name ? (
              <div
                className={['gameCard__name', nameUpgraded ? 'gameCard__name--upgraded' : null]
                  .filter(Boolean)
                  .join(' ')}
              >
                {name}
              </div>
            ) : null}
            {showInk ? (
              <div className="gameCard__ink" aria-label={inkLabel === 'Exhausted' ? 'Exhausted' : `Ink cost ${inkLabel}`}>
                {inkLabel}
              </div>
            ) : null}
          </div>
          <div className="gameCard__art" aria-hidden>
            {illustration ?? (
              <img className="gameCard__artPlaceholder" src={cardIllustrationPlaceholder} alt="" draggable={false} />
            )}
          </div>
          {descriptionContent}
        </div>
      ) : null}
      </div>
      {keywordTip ? <KeywordTooltips ids={keywordIds} x={keywordTip.x} y={keywordTip.y} /> : null}
    </>
  )
}
