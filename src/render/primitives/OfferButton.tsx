import type { ReactNode } from 'react'

export function OfferButton(
  props: Readonly<{
    thumb?: ReactNode
    thumbFramed?: boolean
    title: ReactNode
    description?: ReactNode
    badge?: ReactNode
    disabled?: boolean
    className?: string
    onClick: () => void
  }>,
) {
  const { thumb, thumbFramed = true, title, description, badge, disabled, className, onClick } = props
  return (
    <button
      type="button"
      className={className ? `btn relicOfferBtn ${className}` : 'btn relicOfferBtn'}
      disabled={disabled}
      onClick={onClick}
    >
      {thumb != null ? (thumbFramed ? <div className="relicThumb">{thumb}</div> : thumb) : null}
      <div className="relicOfferText">
        {badge}
        <div>{title}</div>
        {description != null ? <div className="relicOfferDesc">{description}</div> : null}
      </div>
    </button>
  )
}
