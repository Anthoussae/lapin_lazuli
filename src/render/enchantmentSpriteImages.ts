import type { EnchantmentSpriteOverlayId } from '../core/types/enchantments'
import bubbleSprite from '../assets/images/displayElements/bubble.png'
import bubblePopSprite from '../assets/images/displayElements/bubblePop.png'
import antiMagicShellSprite from '../assets/images/displayElements/antiMagicShell.png'
import antiMagicShellPopSprite from '../assets/images/displayElements/antiMagicShellPop.png'
import poisonSprite from '../assets/images/enchantments/poisonEnchantment.png'
import fireCrownSprite from '../assets/images/enchantments/fireCrownEnchantment.png'

const ENCHANTMENT_SPRITE_OVERLAYS: Readonly<Record<EnchantmentSpriteOverlayId, { idle: string; pop: string }>> = {
  BUBBLE: { idle: bubbleSprite, pop: bubblePopSprite },
  ANTI_MAGIC_SHELL: { idle: antiMagicShellSprite, pop: antiMagicShellPopSprite },
  POISON: { idle: poisonSprite, pop: poisonSprite },
  FIRE_CROWN: { idle: fireCrownSprite, pop: fireCrownSprite },
}

export function enchantmentSpriteOverlaySrc(sprite: EnchantmentSpriteOverlayId, phase: 'idle' | 'pop'): string {
  return ENCHANTMENT_SPRITE_OVERLAYS[sprite][phase]
}

export const ENCHANTMENT_PRELOAD_URLS: readonly string[] = [
  bubbleSprite,
  bubblePopSprite,
  antiMagicShellSprite,
  antiMagicShellPopSprite,
  poisonSprite,
  fireCrownSprite,
]
