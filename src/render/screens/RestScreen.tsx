import { darkPurpleBackdrop } from '../assets/backdropImages'
import { restingSprite, sleepIllustrationSprite, studyIllustrationSprite } from '../assets/displayImages'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { RestChoiceButton } from '../primitives/RestChoiceButton'
import { describeSleepHealTooltip } from '../../systems/rest/sleepHeal'
import { describeStudyTooltip } from '../../systems/rest/studyUpgrade'
import type { ScreenProps } from './types'

function restSceneArt(slept: boolean, studied: boolean): string {
  if (slept) return sleepIllustrationSprite
  if (studied) return studyIllustrationSprite
  return restingSprite
}

export function RestScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const rest = state.restOutcome
  const slept = rest?.slept === true
  const studied = rest?.studied === true
  const choiceMade = slept || studied
  const sleepHealAmount = rest?.sleepHealAmount ?? 0

  return (
    <>
      <div className="screenBackdrop screenBackdrop--rest" aria-hidden>
        <img className="screenBackdrop__img" src={darkPurpleBackdrop} alt="" draggable={false} />
      </div>
      <CenteredPanel panelClassName="restPanel">
      <div className="restScene">
        <img className="restScene__art" src={restSceneArt(slept, studied)} alt="" draggable={false} />
      </div>
      <div className="restChoices" role="group" aria-label="Rest choices">
        <RestChoiceButton
          label="Sleep"
          tooltipText={describeSleepHealTooltip(sleepHealAmount)}
          className="btn restChoiceBtn restSleepBtn"
          disabled={choiceMade}
          onClick={() => enqueue({ type: 'REST/SLEEP' })}
        />
        <RestChoiceButton
          label="Study"
          tooltipText={describeStudyTooltip()}
          className="btn restChoiceBtn restStudyBtn"
          disabled={choiceMade}
          onClick={() => enqueue({ type: 'REST/STUDY' })}
        />
      </div>
      <button
        type="button"
        className="btn"
        disabled={!choiceMade}
        onClick={() => enqueue({ type: 'REST/CONTINUE' })}
      >
        Continue
      </button>
      </CenteredPanel>
    </>
  )
}
