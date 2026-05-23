import { monsterSpriteForName } from '../assets/monsterSprites'
import { MonsterDefeatPoof } from './MonsterDefeatPoof'

type CombatMonsterPlaceholderProps = Readonly<{
  /** Label shown beneath the placeholder art (may include boon prefix). */
  name: string
  /** Enemy template display name for sprite lookup; defaults to `name`. */
  spriteName?: string
  /** Plays defeat fall / glow / poof FX. */
  defeating?: boolean
  className?: string
}>

export function CombatMonsterPlaceholder(props: CombatMonsterPlaceholderProps) {
  const { name, spriteName = name, defeating = false, className } = props
  const src = monsterSpriteForName(spriteName)
  const rootClass = [
    'combatMonsterPlaceholder',
    defeating ? 'combatMonsterPlaceholder--defeating' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      {defeating ? <MonsterDefeatPoof /> : null}
      <img className="combatMonsterPlaceholder__art" src={src} alt="" draggable={false} aria-hidden />
      <div className="combatMonsterPlaceholder__name">{name}</div>
    </div>
  )
}
