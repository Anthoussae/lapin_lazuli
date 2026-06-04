import { useIrisTransition } from '../IrisTransitionContext'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RunStatsRecap } from '../primitives/RunStatsRecap'
import type { ScreenProps } from './types'

export function DefeatScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const { isActive, runIrisTransition } = useIrisTransition()

  return (
    <CenteredPanel title="Defeat" titleClassName="defeatScreen__title" panelClassName="defeatScreen__panel">
      <div className="defeatScreen__text">
        An {state.defeat?.enemyName ?? 'enemy'} gobbled you up at level {state.defeat?.level ?? state.level}.
      </div>
      <RunStatsRecap state={state} levelForMax={state.defeat?.level ?? state.level} />
      <button
        className="btn defeatScreen__button"
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
