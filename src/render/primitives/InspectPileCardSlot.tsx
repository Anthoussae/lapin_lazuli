import type { ReactNode } from 'react'

/** Inspect pile card wrapper; hover scale is handled in CSS (see .inspectDeckCardSlot). */
export function InspectPileCardSlot(props: Readonly<{ children: ReactNode }>) {
  return (
    <div className="inspectDeckCardSlot">
      <div className="inspectDeckCardSlot__card">{props.children}</div>
    </div>
  )
}
