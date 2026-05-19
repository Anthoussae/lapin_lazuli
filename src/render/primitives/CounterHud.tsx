import type { GameState } from '../../core/types/state'
import { useGoldTravel } from '../GoldTravelContext'
import { useKeyTravel } from '../KeyTravelContext'
import { TickingNumber } from './TickingNumber'

export function CounterHud(props: Readonly<{ state: GameState }>) {
  const { state } = props
  const { keysHudRef } = useKeyTravel()
  const { goldHudRef } = useGoldTravel()
  return (
    <div className="counterHud" aria-label="Counters">
      <div className="hudText">Level: {state.level}</div>
      <div ref={keysHudRef} className="hudText counterHud__keys">
        Keys: <TickingNumber value={state.player.keys} />
      </div>
      <div ref={goldHudRef} className="hudText counterHud__gold">
        Gold: <TickingNumber value={state.player.gold} />
      </div>
    </div>
  )
}
