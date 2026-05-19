import { useMemo } from 'react'
import { GOLD_BURST_SPRITES } from '../assets/displayImages'

type CoinBurstParticle = Readonly<{
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

function coinBurstParticle(
  index: number,
  src: string,
  seed: number,
  spread: number,
  spreadYFactor: number,
  driftScale: number,
): CoinBurstParticle {
  const base = index * 17 + 3
  const px = (hash01(seed, base) * 2 - 1) * spread
  const py = (hash01(seed, base + 1) * 2 - 1) * spread * spreadYFactor
  const driftX = (hash01(seed, base + 2) - 0.5) * 24 * driftScale
  const driftY = (-8 - hash01(seed, base + 3) * 26) * driftScale
  const rot = (hash01(seed, base + 4) * 2 - 1) * 60
  const scale = 0.45 + hash01(seed, base + 5) * 0.5
  const delayMs = Math.floor(hash01(seed, base + 6) * 4) * 30
  return { id: index, src, px, py, driftX, driftY, rot, scale, delayMs }
}

export function buildCoinBurstParticles(seed: number): ReadonlyArray<CoinBurstParticle> {
  const spread = 36 + hash01(seed, 0) * 22
  const spreadYFactor = 0.55 + hash01(seed, 1) * 0.35
  const driftScale = 0.75 + hash01(seed, 2) * 0.5
  return GOLD_BURST_SPRITES.map((src, i) =>
    coinBurstParticle(i, src, seed, spread, spreadYFactor, driftScale),
  )
}

type CoinBurstProps = Readonly<{
  seed: number
}>

export function CoinBurst(props: CoinBurstProps) {
  const { seed } = props
  const particles = useMemo(() => buildCoinBurstParticles(seed), [seed])

  return (
    <div className="coinBursts" aria-hidden>
      {particles.map((p) => (
        <img
          key={p.id}
          className="coinBurst"
          src={p.src}
          alt=""
          draggable={false}
          style={{
            ['--coin-burst-x' as string]: `${p.px}px`,
            ['--coin-burst-y' as string]: `${p.py}px`,
            ['--coin-burst-drift-x' as string]: `${p.driftX}px`,
            ['--coin-burst-drift-y' as string]: `${p.driftY}px`,
            ['--coin-burst-rot' as string]: `${p.rot}deg`,
            ['--coin-burst-scale' as string]: String(p.scale),
            animationDelay: `${p.delayMs}ms`,
          }}
        />
      ))}
    </div>
  )
}
