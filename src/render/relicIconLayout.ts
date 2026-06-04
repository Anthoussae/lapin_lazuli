/** Relic template ids with hat art tokens in tokens.css (`--relic-*-hat-*`). */
export const HAT_RELIC_ART_IDS = ['RED_HAT', 'GREEN_HAT', 'PURPLE_HAT'] as const

export type HatRelicArtId = (typeof HAT_RELIC_ART_IDS)[number]

export function isHatRelicArtId(relicId: string | undefined): relicId is HatRelicArtId {
  return relicId != null && (HAT_RELIC_ART_IDS as readonly string[]).includes(relicId)
}

/** BEM modifier on `.relicIcon__img`; pairs with rules in game.css. */
export function relicIconArtClassName(relicId: string | undefined): string | undefined {
  if (!isHatRelicArtId(relicId)) return undefined
  return `relicIcon__img--${relicId}`
}
