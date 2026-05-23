import { useMemo } from 'react'
import {
  BUNNY_RELEASE_PUFF_SPRITE_POOL,
  bunnyReleaseBigPoofSprite,
  bunnyReleasePoofSprite,
  bunnyReleaseTinyPoofSprite,
} from '../assets/displayImages'
import { readBunnyReleaseParticleConfig, type BunnyReleaseParticleConfig } from '../bunnyReleaseConfig'

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

function pickSpriteFromPool(pool: readonly string[], seed: number, index: number): string {
  const slot = Math.floor(hash01(seed, index * 31 + 11) * pool.length)
  return pool[slot] ?? pool[0]!
}

function puffParticle(
  index: number,
  src: string,
  seed: number,
  cfg: BunnyReleaseParticleConfig,
  spread: number,
  spreadYFactor: number,
  driftScale: number,
): PuffParticle {
  const base = index * 19 + 5
  const px = (hash01(seed, base) * 2 - 1) * spread
  const py = (hash01(seed, base + 1) * 2 - 1) * spread * spreadYFactor
  const driftX = (hash01(seed, base + 2) - 0.5) * cfg.driftXMax * driftScale
  const driftY = (-cfg.driftYBase - hash01(seed, base + 3) * cfg.driftYRange) * driftScale
  const rot = (hash01(seed, base + 4) * 2 - 1) * cfg.rotMax
  const scale = cfg.scaleMin + hash01(seed, base + 5) * cfg.scaleRange
  const delayMs = Math.floor(hash01(seed, base + 6) * cfg.delaySteps) * cfg.delayStepMs
  return { id: index, src, px, py, driftX, driftY, rot, scale, delayMs }
}

function puffSizeClass(src: string): string {
  if (src === bunnyReleaseBigPoofSprite) return 'vanishPuff vanishPuff--bigPoof'
  if (src === bunnyReleasePoofSprite || src === bunnyReleaseTinyPoofSprite) return 'vanishPuff vanishPuff--poof'
  return 'vanishPuff'
}

function buildBunnyReleaseParticles(
  seed: number,
  spriteCount: number,
  cfg: BunnyReleaseParticleConfig,
): ReadonlyArray<PuffParticle> {
  const pool = BUNNY_RELEASE_PUFF_SPRITE_POOL
  if (spriteCount <= 0 || !pool.length) return []
  const spread = cfg.spreadBase + hash01(seed, 0) * cfg.spreadRange
  const spreadYFactor = cfg.spreadYMin + hash01(seed, 1) * cfg.spreadYRange
  const driftScale = cfg.driftScaleMin + hash01(seed, 2) * cfg.driftScaleRange
  const particles: PuffParticle[] = []
  for (let i = 0; i < spriteCount; i++) {
    const src = pickSpriteFromPool(pool, seed, i)
    particles.push(puffParticle(i, src, seed, cfg, spread, spreadYFactor, driftScale))
  }
  return particles
}

type BunnyReleasePuffsProps = Readonly<{
  seed: number
  spriteCount: number
}>

export function BunnyReleasePuffs(props: BunnyReleasePuffsProps) {
  const { seed, spriteCount } = props
  const particles = useMemo(
    () => buildBunnyReleaseParticles(seed, spriteCount, readBunnyReleaseParticleConfig()),
    [seed, spriteCount],
  )

  return (
    <div className="vanishPuffs" aria-hidden>
      {particles.map((p) => (
        <img
          key={p.id}
          className={puffSizeClass(p.src)}
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
