import { Enemies } from '../../data/enemies'
import { useIrisTransition } from '../IrisTransitionContext'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RunStatsRecap } from '../primitives/RunStatsRecap'
import type { ScreenProps } from './types'

function finalBossName(): string {
  const boss = Object.values(Enemies).find((enemy) => enemy.gameWinOnVictory)
  return boss?.name ?? 'the final boss'
}

export function VictoryScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const { isActive, runIrisTransition } = useIrisTransition()

  return (
    <CenteredPanel title="Victory" titleClassName="defeatScreen__title" panelClassName="defeatScreen__panel">
      <div className="defeatScreen__text">
        You defeated {finalBossName()} at level {state.level} and completed your journey. Congratulations!
      </div>
      <RunStatsRecap state={state} />
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
