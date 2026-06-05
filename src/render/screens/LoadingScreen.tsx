import type { GameState } from '../../core/types/state'

export function LoadingScreen(props: Readonly<{ state: GameState }>) {
  const { state } = props
  const { assets } = state
  const { loaded, total } = assets.progress
  const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
  const hasError = assets.status === 'ERROR'

  return (
    <div className="loadingScreen" role="status" aria-live="polite" aria-busy={!hasError}>
      <div className="loadingScreen__content">
        <h1 className="screenTitle screenTitleMainMenu loadingScreen__title">
          Lapin
          <br />
          Lazuli
        </h1>
        {hasError ? (
          <div className="loadingScreen__error">
            <p className="loadingScreen__errorMessage">Failed to load assets.</p>
            <button className="btn loadingScreen__retryBtn" type="button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          <div className="loadingScreen__progress">
            <div className="loadingScreen__progressTrack" aria-hidden>
              <div className="loadingScreen__progressFill" style={{ width: `${percent}%` }} />
            </div>
            <p className="loadingScreen__progressLabel">Loading… {percent}%</p>
          </div>
        )}
      </div>
    </div>
  )
}
