import type { CSSProperties, ReactNode } from 'react'
import type { CardId } from '../core/types/ids'
import { cardIllustrationForId } from './assets/cardIllustrationImages'
import { cardIllustrationPlaceholder } from './assets/cardImages'

export type CardIllustrationLayout = Readonly<{
  width?: string
  height?: string
  /** Scales art via `--card-illustration-size-modifier`; default token is 1. */
  sizeModifier?: number
  /** Horizontal offset from art-area center (e.g. `2px`, `-4%`). */
  x?: string
  /** Vertical offset from art-area center. */
  y?: string
}>

/** Per-card size/position tweaks when defaults are not quite right. */
export const CARD_ILLUSTRATION_LAYOUT_OVERRIDES: Partial<Record<CardId, CardIllustrationLayout>> = {
  MULTIBUNNIES: { sizeModifier: 3.3, y: '-23px', x:'5px' },
  DEFEND: {sizeModifier: 2.5, y:'-10px', x:'8px'},
  PRACTICE: {y:'-10px'},
  PONDER: {sizeModifier:1.5, y:'-1px'},
  FORTRESS: {sizeModifier:2, x: '8px',y:'-10px'},
  BUNNY_POTION: {sizeModifier:1.8, x: '0px',y:'-10px'},
  WISDOM_POTION: {sizeModifier:1.8, x: '0px',y:'-10px'},
  LETHEAN_WATER: {sizeModifier:1, x: '0px',y:'-10px'},
}

export type CardIllustrationRenderContext = Readonly<{
  cardId: CardId
  src: string
  style: CSSProperties | undefined
}>

export type CardIllustrationCustomRender = (ctx: CardIllustrationRenderContext) => ReactNode

/**
 * Full custom illustration render for a card when layout tokens are not enough.
 * Return `null` to fall back to the default `<img>`.
 */
export const CARD_ILLUSTRATION_CUSTOM_RENDER: Partial<Record<CardId, CardIllustrationCustomRender>> = {}

function layoutVars(layout: CardIllustrationLayout | undefined): CSSProperties | undefined {
  if (!layout) return undefined
  const style: Record<string, string> = {}
  if (layout.width != null) style['--card-illustration-w'] = layout.width
  if (layout.height != null) style['--card-illustration-h'] = layout.height
  if (layout.sizeModifier != null) style['--card-illustration-size-modifier'] = String(layout.sizeModifier)
  if (layout.x != null) style['--card-illustration-x'] = layout.x
  if (layout.y != null) style['--card-illustration-y'] = layout.y
  return Object.keys(style).length ? (style as CSSProperties) : undefined
}

export function cardIllustrationLayoutStyle(cardId: CardId | undefined): CSSProperties | undefined {
  if (!cardId) return undefined
  return layoutVars(CARD_ILLUSTRATION_LAYOUT_OVERRIDES[cardId])
}

export function renderCardIllustration(cardId: CardId | undefined): ReactNode {
  if (!cardId) {
    return (
      <img
        className="gameCard__artImg gameCard__artImg--placeholder"
        src={cardIllustrationPlaceholder}
        alt=""
        draggable={false}
      />
    )
  }

  const src = cardIllustrationForId(cardId)
  const style = cardIllustrationLayoutStyle(cardId)
  const isPlaceholder = src === cardIllustrationPlaceholder
  const custom = CARD_ILLUSTRATION_CUSTOM_RENDER[cardId]
  if (custom) {
    const node = custom({ cardId, src, style })
    if (node != null) return node
  }

  return (
    <img
      className={['gameCard__artImg', isPlaceholder ? 'gameCard__artImg--placeholder' : null]
        .filter(Boolean)
        .join(' ')}
      src={src}
      alt=""
      draggable={false}
      style={style}
    />
  )
}
