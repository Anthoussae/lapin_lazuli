import type { CardDescLine, CardDescSegment } from '../../ui/describe'
import { formatBunnyMultiplier } from '../../ui/describe'
import { KeywordLine } from './KeywordLine'

function formatCardAmount(segment: Extract<CardDescSegment, { kind: 'amount' }>): string {
  if (segment.format === 'multiplier') return formatBunnyMultiplier(segment.display)
  return String(segment.display)
}

function amountClassName(segment: Extract<CardDescSegment, { kind: 'amount' }>): string | undefined {
  if (segment.display > segment.base) return 'gameCard__amtUp'
  if (segment.display < segment.base) return 'gameCard__amtDown'
  return undefined
}

function CardDescSegments(props: Readonly<{ segments: ReadonlyArray<CardDescSegment> }>) {
  const { segments } = props
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') return <span key={i}>{seg.text}</span>
        return (
          <span key={i} className={amountClassName(seg)}>
            {formatCardAmount(seg)}
          </span>
        )
      })}
    </>
  )
}

export function CardDesc(props: Readonly<{ lines: ReadonlyArray<CardDescLine> }>) {
  const { lines } = props
  if (!lines.length) return null
  return (
    <div className="gameCard__desc">
      {lines.map((line, i) => {
        if (line.kind === 'keywords') {
          return <KeywordLine key={i} ids={line.ids} />
        }
        if (line.kind === 'plain') {
          return (
            <div key={i} className="gameCard__descLine">
              {line.text}
            </div>
          )
        }
        return (
          <div key={i} className="gameCard__descLine">
            <CardDescSegments segments={line.segments} />
          </div>
        )
      })}
    </div>
  )
}
