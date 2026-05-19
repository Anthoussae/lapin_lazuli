export type RelicTooltipProps = Readonly<{
  name: string
  effect: string
  x: number
  y: number
}>

export function RelicTooltip(props: RelicTooltipProps) {
  const { name, effect, x, y } = props
  return (
    <div className="relicTooltip" style={{ left: x, top: y }} role="tooltip">
      <div className="relicTooltip__name">{name}</div>
      <div className="relicTooltip__rule" aria-hidden="true">
        ---
      </div>
      {effect ? <div className="relicTooltip__effect">{effect}</div> : null}
    </div>
  )
}
