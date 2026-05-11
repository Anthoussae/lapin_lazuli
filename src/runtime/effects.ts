import type { GameStore } from '../core/store/store'
import { preloadAssets } from './assets'

export function startRuntimeEffects(store: GameStore): () => void {
  let disposed = false
  let bootStarted = false

  const kickBoot = () => {
    if (disposed) return
    const s = store.getState()
    if (!bootStarted && s.phase === 'BOOT') {
      bootStarted = true
      store.dispatch({ type: 'BOOT/START' })
      void preloadAssets().then(({ loaded, failed }) => {
        store.dispatch({ type: 'BOOT/ASSETS_READY', loaded, failed })
      })
    }
  }

  // Kick boot once.
  const stop = store.subscribe(kickBoot)
  kickBoot()

  // Fixed-timestep animation ticks (UI-only). Canonical truth remains reducer-driven.
  let raf = 0
  const stepMs = 1000 / 60
  let last = performance.now()
  let acc = 0

  const loop = (now: number) => {
    if (disposed) return
    const dt = Math.min(250, now - last)
    last = now
    acc += dt
    let frames = 0
    while (acc >= stepMs && frames < 5) {
      acc -= stepMs
      frames++
    }
    if (frames > 0) store.dispatch({ type: 'TICK/FIXED', frames })
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  return () => {
    disposed = true
    stop()
    cancelAnimationFrame(raf)
  }
}

