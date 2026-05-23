import type { EnemyIntent } from '../../core/types/state'
import { combatIntentImageForKind } from '../assets/combatIntentImages'
import { describeEnemyIntent } from '../../ui/describeEnemyIntent'

export type CombatEnemyIntentDisplayProps = Readonly<{
  intent: EnemyIntent | null
  strength: number
}>

function attackDamageForIntent(intent: Extract<EnemyIntent, { kind: 'ATTACK' }>, strength: number): number {
  return intent.damage + Math.max(0, strength)
}

function intentDisplayName(intent: EnemyIntent): string {
  if (intent.kind === 'WAIT') return 'Wait'
  return intent.intentName
}

export function CombatEnemyIntentDisplay(props: CombatEnemyIntentDisplayProps) {
  const { intent, strength } = props
  if (!intent) return null

  const src = combatIntentImageForKind(intent.intentKind)
  const showAttackValue = intent.kind === 'ATTACK'
  const attackValue = showAttackValue ? attackDamageForIntent(intent, strength) : null

  return (
    <div
      className="combatMonsterIntent"
      role="img"
      aria-label={describeEnemyIntent(intent, strength)}
    >
      {attackValue != null ? (
        <div className="combatMonsterIntent__attackValue" aria-hidden>
          {attackValue}
        </div>
      ) : null}
      <img className="combatMonsterIntent__icon" src={src} alt="" draggable={false} aria-hidden />
      <div className="combatMonsterIntent__name" aria-hidden>
        {intentDisplayName(intent)}
      </div>
    </div>
  )
}
