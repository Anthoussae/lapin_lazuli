import { tallscroll } from '../assets/displayImages'
import { useIrisTransition } from '../IrisTransitionContext'
import { CenteredPanel } from '../primitives/CenteredPanel'
import type { ScreenProps } from './types'

export function TitleScreen(props: ScreenProps) {
  const { enqueue } = props
  const { isActive, runIrisTransition } = useIrisTransition()

  return (
    <CenteredPanel panelClassName="titleScreenPanelGame">
      <div className="mainMenuTitle">
        <img className="mainMenuTitle__scroll" src={tallscroll} alt="" draggable={false} />
        <div className="screenTitle screenTitleMainMenu">
          Lapin
          <br />
          Lazuli
        </div>
      </div>
      <button
        className="btn"
        type="button"
        disabled={isActive}
        onClick={() =>
          runIrisTransition(() => {
            enqueue({ type: 'TITLE/NEW_GAME' })
          })
        }
      >
        New Game
      </button>
    </CenteredPanel>
  )
}
