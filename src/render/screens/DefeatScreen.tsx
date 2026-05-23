import { useIrisTransition } from '../IrisTransitionContext'
import { CenteredPanel } from '../primitives/CenteredPanel'
import type { ScreenProps } from './types'

export function DefeatScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const { isActive, runIrisTransition } = useIrisTransition()

  return (
    <CenteredPanel title="Defeat">
      <div className="relicOfferDesc">
        An {state.defeat?.enemyName ?? 'enemy'} gobbled you up at level {state.defeat?.level ?? state.level}.
      </div>
      <button
        className="btn"
        type="button"
        disabled={isActive}
        onClick={() =>
          runIrisTransition(() => enqueue({ type: 'TITLE/MAIN_MENU' }), { screenColor: 'black' })
        }
      >
        Main menu
      </button>
    </CenteredPanel>
  )
}
