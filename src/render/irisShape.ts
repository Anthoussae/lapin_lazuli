export type IrisShape = 'circle' | 'bunny'

const IRIS_SHAPES: ReadonlySet<string> = new Set(['circle', 'bunny'])

/** Reads `--iris-shape` from tokens.css (`circle` | `bunny`). */
export function readIrisShape(): IrisShape {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--iris-shape').trim()
  return IRIS_SHAPES.has(raw) ? (raw as IrisShape) : 'circle'
}

/** Reads `--iris-path-shape` from tokens.css (`circle` | `bunny`). */
export function readIrisPathShape(): IrisShape {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--iris-path-shape').trim()
  return IRIS_SHAPES.has(raw) ? (raw as IrisShape) : 'circle'
}
