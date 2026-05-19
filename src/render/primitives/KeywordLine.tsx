import { CARD_KEYWORDS, type CardKeywordId } from '../../ui/cardKeywords'

export function KeywordLine(props: Readonly<{ ids: ReadonlyArray<CardKeywordId> }>) {
  const { ids } = props
  if (!ids.length) return null
  return (
    <div className="gameCard__descLine gameCard__descLine--keywords">
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 ? ', ' : null}
          <span className="gameCard__keyword">{CARD_KEYWORDS[id].label}</span>
        </span>
      ))}
      .
    </div>
  )
}
