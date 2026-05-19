import { inkJarSpriteForCount } from '../assets/displayImages'

export type InkJarDisplayProps = Readonly<{
  current: number
  max: number
  className?: string
}>

export function InkJarDisplay(props: InkJarDisplayProps) {
  const { current, max, className } = props
  const safeCurrent = Math.max(0, current)
  const safeMax = Math.max(0, max)
  const jarSrc = inkJarSpriteForCount(safeCurrent)

  const rootClass = className ? `inkJarDisplay ${className}` : 'inkJarDisplay'

  return (
    <div className={rootClass} role="status" aria-label={`Ink ${safeCurrent} of ${safeMax}`}>
      <img className="inkJarDisplay__jar" src={jarSrc} alt="" draggable={false} />
      <div className="inkJarDisplay__label" aria-hidden>
        {safeCurrent}
        <span className="inkJarDisplay__sep">/</span>
        <span className="inkJarDisplay__max">{safeMax}</span>
      </div>
    </div>
  )
}
