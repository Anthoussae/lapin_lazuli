export type AnimJob =
  | {
      id: string
      kind: 'FLOAT_TEXT'
      text: string
      x: number
      y: number
      color: 'INFO'
      framesTotal: number
      framesLeft: number
      blocking: boolean
    }
  | {
      id: string
      kind: 'SCREEN_SHAKE'
      magnitude: number
      framesTotal: number
      framesLeft: number
      blocking: boolean
    }

export type AnimState = Readonly<{
  jobs: ReadonlyArray<AnimJob>
}>

export function animInitial(): AnimState {
  return { jobs: [] }
}
