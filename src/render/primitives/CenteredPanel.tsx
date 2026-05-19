import type { ReactNode } from 'react'

export function CenteredPanel(
  props: Readonly<{ title?: ReactNode; titleClassName?: string; panelClassName?: string; children: ReactNode }>,
) {
  const { title, titleClassName, panelClassName, children } = props
  const titleClass = titleClassName ? `screenTitle ${titleClassName}` : 'screenTitle screenTitleScreen'
  return (
    <div className="mapCenter titleScreen">
      <div className={panelClassName ? `titleScreenPanel ${panelClassName}` : 'titleScreenPanel'}>
        {title != null ? <div className={titleClass}>{title}</div> : null}
        {children}
      </div>
    </div>
  )
}
