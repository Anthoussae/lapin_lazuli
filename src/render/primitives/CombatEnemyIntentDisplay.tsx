import type { EnemyInstanceId } from '../../core/types/ids'
import type { EnemyIntent, GameState } from '../../core/types/state'
import { combatIntentImageForKind } from '../assets/combatIntentImages'
import { describeEnemyIntent } from '../../ui/describeEnemyIntent'
import { enemyAttackStrengthDamageBonus } from '../../systems/combat/intentEffects'
import { displayIncomingEnemyAttackDamage } from '../../systems/combat/powerDisplay'

export type CombatEnemyIntentDisplayProps = Readonly<{
  state: GameState
  enemyInstanceId: EnemyInstanceId
  intent: EnemyIntent | null
  strength: number
}>

function intentDisplayName(intent: EnemyIntent): string {
  if (intent.kind === 'WAIT') return 'Wait'
  return intent.intentName
}

export function CombatEnemyIntentDisplay(props: CombatEnemyIntentDisplayProps) {
  const { state, enemyInstanceId, intent, strength } = props
  if (!intent) return null

  const src = combatIntentImageForKind(intent.intentKind)
  const showAttackValue = intent.kind === 'ATTACK'
  const baseAttack =
    showAttackValue && intent.kind === 'ATTACK'
      ? intent.damage + enemyAttackStrengthDamageBonus(strength)
      : 0
  const attackValue = showAttackValue
    ? displayIncomingEnemyAttackDamage(state, enemyInstanceId, baseAttack)
    : null

  return (
    <div
      className="combatMonsterIntent"
      role="img"
      aria-label={describeEnemyIntent(intent, strength, attackValue ?? undefined)}
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
