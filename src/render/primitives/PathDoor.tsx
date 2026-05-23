import type { ReactNode } from 'react'
import { pathDoorLockSprite } from '../assets/displayImages'
import type { PathDoorGlowTone } from '../pathDoorArt'

const GLOW_CLASS: Readonly<Record<PathDoorGlowTone, string>> = {
  combat: 'pathDoor--glowCombat',
  shop: 'pathDoor--glowShop',
  rest: 'pathDoor--glowRest',
  default: 'pathDoor--glowDefault',
}

export function PathDoor(
  props: Readonly<{
    doorSrc: string
    alt: string
    glowTone: PathDoorGlowTone
    locked?: boolean
    disabled?: boolean
    /** Brief open-door beat: keep surround glow and grow it (see game.css). */
    opening?: boolean
    className?: string
    caption?: ReactNode
    onClick: (doorButton: HTMLButtonElement) => void
  }>,
) {
  const { doorSrc, alt, glowTone, locked, disabled, opening, className, caption, onClick } = props

  const btnClass = [
    'pathDoor',
    GLOW_CLASS[glowTone],
    locked ? 'pathDoor--locked' : null,
    disabled ? 'pathDoor--disabled' : null,
    opening ? 'pathDoor--opening' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={btnClass}
      disabled={disabled}
      aria-label={alt}
      onClick={(e) => onClick(e.currentTarget)}
    >
      <span className="pathDoor__art">
        <img className="pathDoor__img" src={doorSrc} alt="" draggable={false} />
        {locked ? (
          <span className="pathDoor__lockOverlay" aria-hidden>
            <img className="pathDoor__lock" src={pathDoorLockSprite} alt="" draggable={false} />
          </span>
        ) : null}
      </span>
      {caption != null ? <span className="pathDoor__caption">{caption}</span> : null}
    </button>
  )
}
