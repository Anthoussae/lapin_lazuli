import { bunnyReleasePoofSprite } from '../assets/displayImages'

/** Single poof burst at the center of a defeating monster. */
export function MonsterDefeatPoof() {
  return (
    <img
      className="monsterDefeatPoof"
      src={bunnyReleasePoofSprite}
      alt=""
      draggable={false}
      aria-hidden
    />
  )
}
