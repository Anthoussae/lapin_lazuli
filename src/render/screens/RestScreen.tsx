import { CenteredPanel } from '../primitives/CenteredPanel'
import type { ScreenProps } from './types'

export function RestScreen(props: ScreenProps) {
  const { state, enqueue } = props
  return (
    <CenteredPanel title="Rest">
      <div className="relicOfferDesc">You rested and healed {state.restOutcome?.healedHp ?? 0} HP.</div>
      <button type="button" className="btn" onClick={() => enqueue({ type: 'REST/CONTINUE' })}>
        Continue
      </button>
    </CenteredPanel>
  )
}
