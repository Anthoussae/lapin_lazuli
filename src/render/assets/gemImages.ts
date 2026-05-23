import type { GemId } from '../../core/types/ids'
import amethyst from '../../assets/images/gems/amethyst.png'
import coal from '../../assets/images/gems/coal.png'
import diamond from '../../assets/images/gems/Diamond.png'
import emerald from '../../assets/images/gems/emerald.png'
import lapisLazuli from '../../assets/images/gems/lapisLazuli.png'
import malachite from '../../assets/images/gems/malachite.png'
import roundRuby from '../../assets/images/gems/roundRuby.png'
import sapphire from '../../assets/images/gems/sapphire.png'
import topaz from '../../assets/images/gems/topaz.png'

export const gemImageMap: Partial<Record<GemId, string>> = {
  LAPIS_LAZULI: lapisLazuli,
  EMERALD: emerald,
  MALACHITE: malachite,
  RUBY: roundRuby,
  SAPPHIRE: sapphire,
  AMETHYST: amethyst,
  TOPAZ: topaz,
  COAL: coal,
  DIAMOND: diamond,
}

export const GEM_PRELOAD_URLS: readonly string[] = Object.values(gemImageMap).filter(
  (url): url is string => url != null,
)

export function gemImageSrc(id: GemId): string | undefined {
  return gemImageMap[id]
}
