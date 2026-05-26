import type { ReactNode } from 'react'

/** Inspect pile card wrapper; hover scale is handled in CSS (see .inspectDeckCardSlot). */
export function InspectPileCardSlot(
  props: Readonly<{ children: ReactNode; collectorOffered?: boolean }>,
) {
  const { children, collectorOffered } = props
  return (
    <div
      className={[
        'inspectDeckCardSlot',
        collectorOffered ? 'inspectDeckCardSlot--collectorOffered' : null,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="inspectDeckCardSlot__card">{children}</div>
    </div>
  )
}
