import type { CSSProperties } from 'react'
import type { CardId } from '../core/types/ids'

/** Keep in sync with `--card-name-single-line-max-symbols` in tokens.css. */
export const CARD_NAME_SINGLE_LINE_MAX_SYMBOLS = 11

export type CardNameTypographyLayout = Readonly<{
  /** Multiplies `--font-card-name-size` via `--card-name-size-modifier`. */
  sizeModifier?: number
  paddingInline?: string
  lineHeight?: string
}>

export type CardTextTypographyLayout = Readonly<{
  /** Multiplies `--font-card-text-size` via `--card-text-size-modifier`. */
  sizeModifier?: number
  maxHeight?: string
  lineHeight?: string
}>

/** Per-card name tweaks when defaults are not quite right. */
export const CARD_NAME_TYPOGRAPHY_OVERRIDES: Partial<Record<CardId, CardNameTypographyLayout>> = {
  CONFLAGRATION: { sizeModifier: 19 / 16 },
  MULTIBUNNIES: { sizeModifier: 23/16 },
}

/** Per-card effect text tweaks when defaults are not quite right. */
export const CARD_TEXT_TYPOGRAPHY_OVERRIDES: Partial<Record<CardId, CardTextTypographyLayout>> = {}

function symbolCount(text: string): number {
  return [...text].length
}

/**
 * ≤ {@link CARD_NAME_SINGLE_LINE_MAX_SYMBOLS} symbols → one line.
 * Otherwise one break at the first space (e.g. "Shield" / "Potion").
 */
export function splitCardNameLines(name: string): readonly [string] | readonly [string, string] {
  if (symbolCount(name) <= CARD_NAME_SINGLE_LINE_MAX_SYMBOLS) {
    return [name]
  }
  const firstSpace = name.indexOf(' ')
  if (firstSpace <= 0) return [name]
  return [name.slice(0, firstSpace), name.slice(firstSpace + 1)]
}

function nameLayoutVars(layout: CardNameTypographyLayout | undefined): Record<string, string> {
  if (!layout) return {}
  const style: Record<string, string> = {}
  if (layout.sizeModifier != null) style['--card-name-size-modifier'] = String(layout.sizeModifier)
  if (layout.paddingInline != null) style['--card-name-padding-inline'] = layout.paddingInline
  if (layout.lineHeight != null) style['--card-name-line-height'] = layout.lineHeight
  return style
}

function textLayoutVars(layout: CardTextTypographyLayout | undefined): Record<string, string> {
  if (!layout) return {}
  const style: Record<string, string> = {}
  if (layout.sizeModifier != null) style['--card-text-size-modifier'] = String(layout.sizeModifier)
  if (layout.maxHeight != null) style['--card-desc-max-height'] = layout.maxHeight
  if (layout.lineHeight != null) style['--card-text-line-height'] = layout.lineHeight
  return style
}

/** CSS custom properties for `.gameCard` from per-card typography overrides. */
export function cardTypographyLayoutStyle(cardId: CardId | undefined): CSSProperties | undefined {
  if (!cardId) return undefined
  const merged = { ...nameLayoutVars(CARD_NAME_TYPOGRAPHY_OVERRIDES[cardId]), ...textLayoutVars(CARD_TEXT_TYPOGRAPHY_OVERRIDES[cardId]) }
  return Object.keys(merged).length ? (merged as CSSProperties) : undefined
}

export function CardName(props: Readonly<{ name: string; upgraded?: boolean }>) {
  const { name, upgraded } = props
  const lines = splitCardNameLines(name)
  const classes = [
    'gameCard__name',
    lines.length === 1 ? 'gameCard__name--singleLine' : 'gameCard__name--split',
    upgraded ? 'gameCard__name--upgraded' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {lines.map((line, i) => (
        <span key={i} className="gameCard__nameLine">
          {line}
        </span>
      ))}
    </div>
  )
}
