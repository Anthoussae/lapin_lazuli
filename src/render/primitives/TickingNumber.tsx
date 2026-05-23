import { useTickingNumber, type UseTickingNumberOptions } from '../hooks/useTickingNumber'

export type TickingNumberProps = Readonly<
  {
    value: number
    className?: string
  } & UseTickingNumberOptions
>

export function TickingNumber(props: TickingNumberProps) {
  const { value, className, durationMs } = props
  const { display } = useTickingNumber(value, { durationMs })
  const classes = className ? `tickingNumber ${className}` : 'tickingNumber'
  return <span className={classes}>{display}</span>
}
