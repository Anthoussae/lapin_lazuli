/** UI element that receives a buff/debuff pulse when a relic or boon trigger fires. */
export type TriggerFxTargetKind = 'playerLockedShield' | 'playerShield' | 'cauldron' | 'inkJar' | 'deck'

export type TriggerFxTargetDef = Readonly<{
  kind: TriggerFxTargetKind
  role: 'buff' | 'debuff'
}>

/** Brief trigger animation: source pulse on the relic/enemy plus optional target pulses. */
export type TriggerFxDef = Readonly<{
  targets?: ReadonlyArray<TriggerFxTargetDef>
}>
