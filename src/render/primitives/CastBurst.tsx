import { useMemo } from 'react'
import { CAST_BURST_SPRITES, castBurstSprite } from '../assets/displayImages'

export type CastBurstParticle = Readonly<{
  id: number
  src: string
  px: number
  py: number
  driftX: number
  driftY: number
  rot: number
  scale: number
  delayMs: number
}>

/** Deterministic unit float in [0, 1) from seed + salt. */
function hash01(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt, 0x9e3779b9)) | 0
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function castBurstParticle(
  index: number,
  src: string,
  seed: number,
  spread: number,
  spreadYFactor: number,
  driftScale: number,
): CastBurstParticle {
  const base = index * 17 + 3
  const px = (hash01(seed, base) * 2 - 1) * spread
  const py = (hash01(seed, base + 1) * 2 - 1) * spread * spreadYFactor
  const driftX = (hash01(seed, base + 2) - 0.5) * 22 * driftScale
  const driftY = (-10 - hash01(seed, base + 3) * 28) * driftScale
  const rot = (hash01(seed, base + 4) * 2 - 1) * 48
  const scale = 0.5 + hash01(seed, base + 5) * 0.55
  const delayMs = Math.floor(hash01(seed, base + 6) * 4) * 30
  return { id: index, src, px, py, driftX, driftY, rot, scale, delayMs }
}

/** Build a unique star layout for one cast burst. */
export function buildCastBurstParticles(seed: number): ReadonlyArray<CastBurstParticle> {
  const spread = 34 + hash01(seed, 0) * 20
  const spreadYFactor = 0.55 + hash01(seed, 1) * 0.35
  const driftScale = 0.75 + hash01(seed, 2) * 0.5
  return CAST_BURST_SPRITES.map((src, i) =>
    castBurstParticle(i, src, seed, spread, spreadYFactor, driftScale),
  )
}

type CastBurstProps = Readonly<{
  seed: number
}>

export function CastBurst(props: CastBurstProps) {
  const { seed } = props
  const particles = useMemo(() => buildCastBurstParticles(seed), [seed])

  return (
    <div className="castBursts" aria-hidden>
      {particles.map((p) => (
        <img
          key={p.id}
          className={p.src === castBurstSprite ? 'castBurst castBurst--star' : 'castBurst'}
          src={p.src}
          alt=""
          draggable={false}
          style={{
            ['--cast-x' as string]: `${p.px}px`,
            ['--cast-y' as string]: `${p.py}px`,
            ['--cast-drift-x' as string]: `${p.driftX}px`,
            ['--cast-drift-y' as string]: `${p.driftY}px`,
            ['--cast-rot' as string]: `${p.rot}deg`,
            ['--cast-scale' as string]: String(p.scale),
            animationDelay: `${p.delayMs}ms`,
          }}
        />
      ))}
    </div>
  )
}
