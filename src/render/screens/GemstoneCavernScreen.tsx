import { Cards } from '../../data/cards'
import { Gems } from '../../data/gems'
import { collectKeywordIdsFromDescriptionLines } from '../../ui/cardKeywords'
import { gemOfferDescriptionLines } from '../../ui/describe'
import { socketableDeckCards } from '../../systems/gems/socketing'
import { GameCardView } from '../primitives/GameCardView'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { GemOfferDesc } from '../primitives/GemOfferDesc'
import { KeywordHoverHost } from '../primitives/KeywordHoverHost'
import { OfferButton } from '../primitives/OfferButton'
import type { ScreenProps } from './types'

export function GemstoneCavernScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const cavern = state.gemstoneCavern

  if (cavern?.socketing) {
    const gemName = Gems[cavern.socketing.gemId]?.name ?? cavern.socketing.gemId
    return (
      <CenteredPanel title={`Socket (${gemName}) into a card`}>
        <button type="button" className="btn" onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/SKIP_SOCKETING' })}>
          Skip
        </button>
        <div className="gemstoneSocketCardList">
          {socketableDeckCards(state).map((inst) => {
            const t = Cards[inst.templateId]
            const selected = cavern.socketing?.selectedCardInstanceId === inst.id
            return (
              <GameCardView
                key={inst.id}
                inst={inst}
                template={t}
                power={state.player.power}
                firepowerMultiplier={state.player.firepowerMultiplier}
                selected={selected}
                className="gemstoneSocketCard"
                onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/SELECT_SOCKET_CARD', cardInstanceId: inst.id })}
              />
            )
          })}
        </div>
        {cavern.socketing.selectedCardInstanceId ? (
          <button type="button" className="btn" onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/CONFIRM_SOCKETING' })}>
            Confirm socketing {gemName}
          </button>
        ) : null}
      </CenteredPanel>
    )
  }

  return (
    <CenteredPanel title="Gemstone Cavern">
      {(cavern?.offered ?? []).map((gemId, idx) => {
        const gem = Gems[gemId]
        const descLines = gem ? gemOfferDescriptionLines(gem) : []
        const keywordIds = collectKeywordIdsFromDescriptionLines(descLines)
        return (
          <KeywordHoverHost key={`${gemId}-${idx}`} keywordIds={keywordIds}>
            <OfferButton
              title={gem?.name ?? gemId}
              description={descLines.length ? <GemOfferDesc lines={descLines} /> : undefined}
              onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/PICK_GEM', gemId })}
            />
          </KeywordHoverHost>
        )
      })}
      <button type="button" className="btn" onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/PROCEED' })}>
        Proceed
      </button>
    </CenteredPanel>
  )
}
