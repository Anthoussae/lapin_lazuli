import { GameTooltipStack } from './GameTooltip'

export type RelicTooltipProps = Readonly<{
  name: string
  effect: string
  x: number
  y: number
}>

export function RelicTooltip(props: RelicTooltipProps) {
  const { name, effect, x, y } = props
  return (
    <GameTooltipStack
      entries={[{ key: name, label: name, text: effect || undefined }]}
      x={x}
      y={y}
      anchor="topCenter"
    />
  )
}
