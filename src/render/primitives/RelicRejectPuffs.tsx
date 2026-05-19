import { useMemo, useState } from 'react'
import { RELIC_REJECT_PUFF_SPRITES, relicRejectPoofSprite } from '../assets/displayImages'

type PuffParticle = Readonly<{
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

function puffParticle(
  index: number,
  src: string,
  seed: number,
  spread: number,
  spreadYFactor: number,
  driftScale: number,
): PuffParticle {
  const base = index * 19 + 5
  const px = (hash01(seed, base) * 2 - 1) * spread
  const py = (hash01(seed, base + 1) * 2 - 1) * spread * spreadYFactor
  const driftX = (hash01(seed, base + 2) - 0.5) * 28 * driftScale
  const driftY = (-12 - hash01(seed, base + 3) * 24) * driftScale
  const rot = (hash01(seed, base + 4) * 2 - 1) * 36
  const scale = 0.55 + hash01(seed, base + 5) * 0.45
  const delayMs = Math.floor(hash01(seed, base + 6) * 5) * 35
  return { id: index, src, px, py, driftX, driftY, rot, scale, delayMs }
}

function buildRejectPuffParticles(seed: number): ReadonlyArray<PuffParticle> {
  const spread = 42 + hash01(seed, 0) * 22
  const spreadYFactor = 0.6 + hash01(seed, 1) * 0.3
  const driftScale = 0.75 + hash01(seed, 2) * 0.5
  return RELIC_REJECT_PUFF_SPRITES.map((src, i) =>
    puffParticle(i, src, seed, spread, spreadYFactor, driftScale),
  )
}

export function RelicRejectPuffs() {
  const [seed] = useState(() => (Math.random() * 0x7fffffff) | 0)
  const particles = useMemo(() => buildRejectPuffParticles(seed), [seed])

  return (
    <div className="relicRejectPuffs" aria-hidden>
      {particles.map((p) => (
        <img
          key={p.id}
          className={p.src === relicRejectPoofSprite ? 'relicRejectPuff relicRejectPuff--poof' : 'relicRejectPuff'}
          src={p.src}
          alt=""
          draggable={false}
          style={{
            ['--puff-x' as string]: `${p.px}px`,
            ['--puff-y' as string]: `${p.py}px`,
            ['--puff-drift-x' as string]: `${p.driftX}px`,
            ['--puff-drift-y' as string]: `${p.driftY}px`,
            ['--puff-rot' as string]: `${p.rot}deg`,
            ['--puff-scale' as string]: String(p.scale),
            animationDelay: `${p.delayMs}ms`,
          }}
        />
      ))}
    </div>
  )
}
