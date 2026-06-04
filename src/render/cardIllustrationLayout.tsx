import type { CSSProperties, ReactNode } from 'react'
import type { CardId } from '../core/types/ids'
import type { Cards } from '../data/cards'
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
export const CARD_ILLUSTRATION_LAYOUT_OVERRIDES: Record<keyof typeof Cards, CardIllustrationLayout> = {
  ANTI_MAGIC_SHELL: { sizeModifier: 1.5, x: '-2px', y: '0px' },
  BANANA_JUICE: {sizeModifier:1.5, x: '-2px', y: '4px'},
  BUNNYMANCY: {sizeModifier:1.7, x: '-0px', y: '0px'},
  BUNNY_POTION: { sizeModifier: 1.3, x: '0px', y: '0px' },
  BUNNY_SUMMONS: {sizeModifier:1.8, x: '-0px', y: '0px'},
  BUNNYFORM: { sizeModifier: 1.9, x: '0px', y: '-6px' },
  BUBBLE_MIX: {sizeModifier:1.7, x: '-2px', y: '-13px'},
  CARROT_CAKE: {},
  CLOUDBUNNY: {sizeModifier:1.7, x: '-0px', y: '0px'},
  CLOVER_JUICE: {sizeModifier:1.4, x: '-0px', y: '7px'},
  CLUTTER: {sizeModifier:2, x: '-0px', y: '0px'},
  CONFLAGRATION: {sizeModifier:1.5, x: '-0px', y: '0px'},
  CROWN_OF_FLAMES: {sizeModifier:1.7, x: '-0px', y: '16px'},
  DEFEND: { sizeModifier: 2, y: '-11px', x: '8px' },
  DISPEL: {sizeModifier:1.5, x: '-0px', y: '5px'},
  DODGE: {sizeModifier:1.9, x: '-0px', y: '0px'},
  FIREBALL: {sizeModifier:1.7, x: '-0px', y: '0px'},
  FIREBALL_POTION: { sizeModifier: 2, x: '0px', y: '-10px' },
  FLAME_SLASH: { sizeModifier: 1.5, x: '0px', y: '-10px' },
  FORTRESS: { sizeModifier: 2, x: '8px', y: '-10px' },
  GUARDIAN_ANGEL: { sizeModifier: 1.5, x: '0px', y: '3px' },
  HARE_RAISING: {sizeModifier:1.9, x: '-0px', y: '-6px'},
  HEALTH_POTION: { sizeModifier: 1.5, x: '0px', y: '9px' },
  INKSWELL_RITUAL: {sizeModifier:2.2, x: '-0px', y: '-6px'},
  LEAD_INGOT: {sizeModifier:1.9, x: '-0px', y: '0px'},
  LETHEAN_WATER: { sizeModifier: 0.8, x: '0px', y: '0px' },
  MULTIBUNNIES: { sizeModifier: 2.9, y: '-23px', x: '5px' },
  POISON: {sizeModifier:1.7, x: '-0px', y: '0px'},
  PONDER: { sizeModifier: 1.5, y: '-1px' },
  PRACTICE: { sizeModifier: 1.7, y: '-10px' },
  SHIELD_POTION: { sizeModifier: 2.5, x: '7px', y: '-15px' },
  SHATTERING_BLAST: { sizeModifier: 1.7, y: '6px' },
  SMOG: { sizeModifier: 1.7, x: '0px', y: '-8px' },
  SMOKE: {sizeModifier:1.7, x: '-0px', y: '-5px'},
  SQUID_POTION: {sizeModifier:1.7, x: '-0px', y: '0px'},
  STONESKIN: {sizeModifier:1.7, x: '-0px', y: '-5px'},
  WARM: {sizeModifier:2, x: '-0px', y: '-5px'},
  WILLOWBARK_TEA: { sizeModifier: 1.2, x: '0px', y: '1px' },
  WISE_BUNNIES: {sizeModifier:1.7, x: '-0px', y: '5px'},
  WISDOM_POTION: { sizeModifier: 1.8, x: '0px', y: '-10px' },
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
