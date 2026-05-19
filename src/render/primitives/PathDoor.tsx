import type { ReactNode } from 'react'
import { keySprite } from '../assets/displayImages'
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
    className?: string
    caption?: ReactNode
    onClick: () => void
  }>,
) {
  const { doorSrc, alt, glowTone, locked, disabled, className, caption, onClick } = props

  const btnClass = [
    'pathDoor',
    GLOW_CLASS[glowTone],
    locked ? 'pathDoor--locked' : null,
    disabled ? 'pathDoor--disabled' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={btnClass} disabled={disabled} aria-label={alt} onClick={onClick}>
      <span className="pathDoor__art">
        <img className="pathDoor__img" src={doorSrc} alt="" draggable={false} />
        {locked ? <img className="pathDoor__lock" src={keySprite} alt="" draggable={false} /> : null}
      </span>
      {caption != null ? <span className="pathDoor__caption">{caption}</span> : null}
    </button>
  )
}
