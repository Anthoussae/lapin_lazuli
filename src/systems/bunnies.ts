/** Player bunny count: no fractions (`Math.ceil`). Negatives allowed (e.g. Draining). */
export function normalizeBunnies(n: number): number {
  return Math.ceil(n)
}
