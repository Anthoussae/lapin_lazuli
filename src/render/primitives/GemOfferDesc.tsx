import type { CardDescLine } from '../../ui/describe'
import { KeywordLine } from './KeywordLine'

export function GemOfferDesc(props: Readonly<{ lines: ReadonlyArray<CardDescLine> }>) {
  const { lines } = props
  if (!lines.length) return null
  return (
    <>
      {lines.map((line, i) => {
        if (line.kind === 'keywords') {
          return <KeywordLine key={i} ids={line.ids} />
        }
        if (line.kind === 'plain') {
          return (
            <div key={i} className="gemOfferDesc__line">
              {line.text}
            </div>
          )
        }
        return null
      })}
    </>
  )
}
