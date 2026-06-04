import type { GameState } from '../../core/types/state'

type RunStatsRecapProps = Readonly<{
  state: GameState
  /** When set, max level is at least this (e.g. defeat snapshot level). */
  levelForMax?: number
}>

export function RunStatsRecap(props: RunStatsRecapProps) {
  const { state, levelForMax } = props
  const maxLevelReached = Math.max(state.runStats.maxLevelReached, levelForMax ?? state.level)
  const finalDeckSize = Object.keys(state.player.deck.cardById).length

  return (
    <div className="defeatScreen__stats">
      <div className="defeatScreen__statsRow">
        <div className="defeatScreen__statsLabel">Max level reached:</div>
        <div className="defeatScreen__statsValue">{maxLevelReached}</div>
      </div>
      <div className="defeatScreen__statsRow">
        <div className="defeatScreen__statsLabel">Total gold obtained:</div>
        <div className="defeatScreen__statsValue">{state.runStats.totalGoldObtained}</div>
      </div>
      <div className="defeatScreen__statsRow">
        <div className="defeatScreen__statsLabel">Relics obtained:</div>
        <div className="defeatScreen__statsValue">{state.runStats.relicsObtained}</div>
      </div>
      <div className="defeatScreen__statsRow">
        <div className="defeatScreen__statsLabel">Gems obtained:</div>
        <div className="defeatScreen__statsValue">{state.runStats.gemsObtained}</div>
      </div>
      <div className="defeatScreen__statsRow">
        <div className="defeatScreen__statsLabel">Enemies defeated:</div>
        <div className="defeatScreen__statsValue">{state.runStats.enemiesDefeated}</div>
      </div>
      <div className="defeatScreen__statsRow">
        <div className="defeatScreen__statsLabel">Total card upgrades:</div>
        <div className="defeatScreen__statsValue">{state.runStats.totalCardUpgrades}</div>
      </div>
      <div className="defeatScreen__statsRow">
        <div className="defeatScreen__statsLabel">Final deck size:</div>
        <div className="defeatScreen__statsValue">{finalDeckSize}</div>
      </div>
    </div>
  )
}
