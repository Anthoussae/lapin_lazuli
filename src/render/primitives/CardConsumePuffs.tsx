import { useMemo } from 'react'
import {
  CARD_CONSUME_PUFF_SPRITE_POOL,
  bunnyReleaseBigPoofSprite,
  bunnyReleasePoofSprite,
  bunnyReleaseTinyPoofSprite,
} from '../assets/displayImages'
import { hash01 } from '../bunnyLeapPath'
import { readCardConsumeParticleConfig, type CardConsumeParticleConfig } from '../cardConsumeConfig'

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

function pickSpriteFromPool(pool: readonly string[], seed: number, index: number): string {
  const slot = Math.floor(hash01(seed, index * 31 + 11) * pool.length)
  return pool[slot] ?? pool[0]!
}

function puffParticle(
  index: number,
  src: string,
  seed: number,
  cfg: CardConsumeParticleConfig,
): PuffParticle {
  const base = index * 19 + 5
  const spread = cfg.spreadBase + hash01(seed, 0) * cfg.spreadRange
  const angle = hash01(seed, base) * Math.PI * 2
  const px = Math.cos(angle) * spread * hash01(seed, base + 1)
  const py = Math.sin(angle) * spread * hash01(seed, base + 2)
  const driftDist = cfg.driftMin + hash01(seed, base + 3) * cfg.driftRange
  const driftX = Math.cos(angle) * driftDist
  const driftY = Math.sin(angle) * driftDist
  const rot = (hash01(seed, base + 4) * 2 - 1) * cfg.rotMax
  const scale = cfg.scaleMin + hash01(seed, base + 5) * cfg.scaleRange
  const delayMs = Math.floor(hash01(seed, base + 6) * cfg.delaySteps) * cfg.delayStepMs
  return { id: index, src, px, py, driftX, driftY, rot, scale, delayMs }
}

function puffSizeClass(src: string): string {
  if (src === bunnyReleaseBigPoofSprite) return 'cardConsumePuff cardConsumePuff--big'
  if (src === bunnyReleaseTinyPoofSprite) return 'cardConsumePuff cardConsumePuff--tiny'
  if (src === bunnyReleasePoofSprite) return 'cardConsumePuff cardConsumePuff--poof'
  return 'cardConsumePuff'
}

function buildCardConsumeParticles(seed: number, cfg: CardConsumeParticleConfig): ReadonlyArray<PuffParticle> {
  const pool = CARD_CONSUME_PUFF_SPRITE_POOL
  if (!pool.length || cfg.puffCount <= 0) return []
  const particles: PuffParticle[] = []
  for (let i = 0; i < cfg.puffCount; i++) {
    const src = pickSpriteFromPool(pool, seed, i)
    particles.push(puffParticle(i, src, seed, cfg))
  }
  return particles
}

type CardConsumePuffsProps = Readonly<{
  seed: number
}>

export function CardConsumePuffs(props: CardConsumePuffsProps) {
  const { seed } = props
  const particles = useMemo(
    () => buildCardConsumeParticles(seed, readCardConsumeParticleConfig()),
    [seed],
  )

  return (
    <div className="cardConsumePuffs" aria-hidden>
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
