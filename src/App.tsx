import { useEffect, useLayoutEffect, useMemo, useSyncExternalStore } from 'react'
import { createGameStore } from './core/store/store'
import { startRuntimeEffects } from './runtime/effects'
import { GameView } from './render/GameView'
import './App.css'

function useStageScale() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const compute = () => {
      const targetW = 1280
      const targetH = 720
      // Treat the game as a fixed virtual viewport (Flash-like): only a uniform scale changes.
      // Apply a constant comfort scale so the viewport sits nicer in the browser.
      const comfortScale = 0.85
      const fitScale = Math.min(window.innerWidth / targetW, window.innerHeight / targetH)
      const scale = Math.max(0.25, fitScale * comfortScale)
      root.style.setProperty('--game-scale', String(scale))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])
}

function App() {
  useStageScale()

  const store = useMemo(() => createGameStore(), [])
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)

  useEffect(() => startRuntimeEffects(store), [store])

  return (
    <div className="stageRoot">
      <div className="stageScaled">
        <div className="stageFrame">
          <GameView state={state} dispatch={store.dispatch} />
        </div>
      </div>
    </div>
  )
}

export default App
