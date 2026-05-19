import { CenteredPanel } from '../primitives/CenteredPanel'
import type { ScreenProps } from './types'

export function VictoryScreen(props: ScreenProps) {
  const { enqueue } = props
  return (
    <CenteredPanel title="Victory">
      <div className="relicOfferDesc">You defeated Miso Tyrant and completed your journey. Congratulations!</div>
      <button className="btn" onClick={() => enqueue({ type: 'TITLE/MAIN_MENU' })}>
        Main menu
      </button>
    </CenteredPanel>
  )
}
