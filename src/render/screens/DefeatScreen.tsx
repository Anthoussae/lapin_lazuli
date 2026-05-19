import { CenteredPanel } from '../primitives/CenteredPanel'
import type { ScreenProps } from './types'

export function DefeatScreen(props: ScreenProps) {
  const { state, enqueue } = props
  return (
    <CenteredPanel title="Defeat">
      <div className="relicOfferDesc">
        An {state.defeat?.enemyName ?? 'enemy'} gobbled you up at level {state.defeat?.level ?? state.level}.
      </div>
      <button className="btn" onClick={() => enqueue({ type: 'TITLE/MAIN_MENU' })}>
        Main menu
      </button>
    </CenteredPanel>
  )
}
