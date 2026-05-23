import monsterPlaceholder1 from '../../assets/images/monsters/monsterPlaceholder1.png'

/** Default combat monster art when no named sprite is registered. */
export const MONSTER_PLACEHOLDER_SPRITE = monsterPlaceholder1

/**
 * Maps enemy display name → sprite URL under assets/images/monsters/.
 * Add imports and entries as per-monster PNGs are added.
 */
export const MONSTER_SPRITES_BY_NAME: Readonly<Record<string, string>> = {
  // Example: 'Okra Jelly': okraJellySprite,
}

/** Resolves combat monster art from template display name; falls back to placeholder. */
export function monsterSpriteForName(name: string): string {
  return MONSTER_SPRITES_BY_NAME[name] ?? MONSTER_PLACEHOLDER_SPRITE
}
