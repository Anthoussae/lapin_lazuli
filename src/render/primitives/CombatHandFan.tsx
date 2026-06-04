import type { ReactNode } from 'react'
import { combatHandFanSlotStyle, type HandFanSlotStacking } from '../combatHandFanLayout'

export type CombatHandFanSlot = Readonly<{
  key: string
  node: ReactNode
  exhausted?: boolean
}> &
  HandFanSlotStacking

type CombatHandFanProps = Readonly<{
  slots: ReadonlyArray<CombatHandFanSlot>
  onSlotRef?: (key: string, el: HTMLDivElement | null) => void
}>

export function CombatHandFan(props: CombatHandFanProps) {
  const { slots, onSlotRef } = props
  const count = slots.length

  return (
    <>
      {slots.map((slot, index) => (
        <div
          key={slot.key}
          ref={onSlotRef ? (el) => onSlotRef(slot.key, el) : undefined}
          className={['handFan__slot gameCardHoverHost', slot.exhausted ? 'handFan__slot--exhausted' : null]
            .filter(Boolean)
            .join(' ')}
          style={combatHandFanSlotStyle(index, count, slots)}
        >
          {slot.node}
        </div>
      ))}
    </>
  )
}
