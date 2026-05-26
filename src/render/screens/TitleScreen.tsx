import { plainPinkBackdrop } from '../assets/backdropImages'
import { playerPlaceholderSprite, tallscroll } from '../assets/displayImages'
import { useIrisTransition } from '../IrisTransitionContext'
import { CenteredPanel } from '../primitives/CenteredPanel'
import type { ScreenProps } from './types'

export function TitleScreen(props: ScreenProps) {
  const { enqueue } = props
  const { isActive, runIrisTransition } = useIrisTransition()

  return (
    <>
      <div className="screenBackdrop screenBackdrop--title" aria-hidden>
        <img className="screenBackdrop__img" src={plainPinkBackdrop} alt="" draggable={false} />
      </div>
      <div className="mainMenuPlayerPlaceholder" role="img" aria-label="Player">
        <img
          className="mainMenuPlayerPlaceholder__art"
          src={playerPlaceholderSprite}
          alt=""
          draggable={false}
        />
      </div>
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
    </>
  )
}
