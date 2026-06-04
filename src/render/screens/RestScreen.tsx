import { useEffect, useMemo, useState } from 'react'
import { darkPurpleBackdrop } from '../assets/backdropImages'
import { restingSprite, sleepIllustrationSprite, studyIllustrationSprite } from '../assets/displayImages'
import { CenteredPanel } from '../primitives/CenteredPanel'
import { CastBurst } from '../primitives/CastBurst'
import { GameCardView } from '../primitives/GameCardView'
import { RestChoiceButton } from '../primitives/RestChoiceButton'
import { describeSleepHealTooltip } from '../../systems/rest/sleepHeal'
import { describeStudyTooltip } from '../../systems/rest/studyUpgrade'
import { Cards } from '../../data/cards'
import type { CardInstance } from '../../core/types/state'
import type { ScreenProps } from './types'

function restSceneArt(slept: boolean, studied: boolean): string {
  if (slept) return sleepIllustrationSprite
  if (studied) return studyIllustrationSprite
  return restingSprite
}

function parseCssDurationMs(raw: string, fallbackMs: number): number {
  const t = raw.trim()
  if (!t) return fallbackMs
  if (t.endsWith('ms')) {
    const n = Number(t.slice(0, -2).trim())
    return Number.isFinite(n) ? n : fallbackMs
  }
  if (t.endsWith('s')) {
    const n = Number(t.slice(0, -1).trim())
    return Number.isFinite(n) ? Math.round(n * 1000) : fallbackMs
  }
  const n = Number(t)
  return Number.isFinite(n) ? n : fallbackMs
}

function readStudyRevealTotalMs(): number {
  if (typeof window === 'undefined') return 2310
  const styles = window.getComputedStyle(document.documentElement)
  const fadeIn = parseCssDurationMs(styles.getPropertyValue('--rest-study-reveal-fade-in-ms'), 250)
  const fadeOut = parseCssDurationMs(styles.getPropertyValue('--rest-study-reveal-fade-out-ms'), 2000)
  return fadeIn + fadeOut + 80
}

function RestStudyReveal(props: Readonly<{ card: CardInstance | null; gameLevel: number }>) {
  const { card, gameLevel } = props
  const [visible, setVisible] = useState(false)
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    if (!card) {
      setVisible(false)
      return
    }
    setSeed(((Math.random() * 0x7fffffff) | 0) ^ (card.upgrades * 7919))
    setVisible(true)
    const t = window.setTimeout(() => setVisible(false), readStudyRevealTotalMs())
    return () => window.clearTimeout(t)
  }, [card])

  const template = card ? Cards[card.templateId] : undefined
  if (!visible || !card || !template) return null

  return (
    <div className="restStudyReveal" aria-hidden>
      <div className="restStudyReveal__cast">
        <CastBurst seed={seed} />
      </div>
      <div className="restStudyReveal__card">
        <GameCardView template={template} inst={card} gameLevel={gameLevel} staticDisplay />
      </div>
    </div>
  )
}

export function RestScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const rest = state.restOutcome
  const slept = rest?.slept === true
  const studied = rest?.studied === true
  const choiceMade = slept || studied
  const sleepHealAmount = rest?.sleepHealAmount ?? 0
  const studiedCard = useMemo(() => {
    const cid = rest?.studiedCardInstanceId
    if (!cid) return null
    return state.player.deck.cardById[cid] ?? null
  }, [rest?.studiedCardInstanceId, state.player.deck.cardById])

  return (
    <>
      <div className="screenBackdrop screenBackdrop--rest" aria-hidden>
        <img className="screenBackdrop__img" src={darkPurpleBackdrop} alt="" draggable={false} />
      </div>
      <CenteredPanel panelClassName="restPanel">
      <div className="restScene">
        <img className="restScene__art" src={restSceneArt(slept, studied)} alt="" draggable={false} />
      </div>
      {studied ? <RestStudyReveal card={studiedCard} gameLevel={state.level} /> : null}
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
