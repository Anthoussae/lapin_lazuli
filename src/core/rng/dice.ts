import type { RngState } from './rng'
import { rngInt } from './rng'

export type DiceSpec = Readonly<{ count: number; sides: number; plus?: number }>

export function rollDice(rng: RngState, spec: DiceSpec): readonly [RngState, number] {
  let r = rng
  let total = spec.plus ?? 0
  const c = Math.max(0, spec.count | 0)
  const s = Math.max(1, spec.sides | 0)
  for (let i = 0; i < c; i++) {
    const [r2, n] = rngInt(r, 1, s + 1) // 1..s
    r = r2
    total += n
  }
  return [r, total]
}

