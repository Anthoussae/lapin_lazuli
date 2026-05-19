import { useEffect, useRef } from 'react'
import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../../reducers/actions'
import { Cards } from '../../data/cards'
import { Enemies } from '../../data/enemies'
import { EnemyBoons } from '../../data/enemyBoons'
import { describeEnemyIntent } from '../../ui/describeEnemyIntent'
import { combatEffectiveMaxEnergy } from '../../systems/combat/zones'
import { cardInstanceOpensHandSelection } from '../../systems/cards/cardEffects'
import { cardInstanceIsPlayable } from '../../systems/cards/inkCost'
import { useCastBurst } from '../CastBurstContext'
import { CombatHandFan } from '../primitives/CombatHandFan'
import { useCombatHandDrawAnimations } from '../hooks/useCombatHandDrawAnimations'
import { GameCardView } from '../primitives/GameCardView'
import { InkJarDisplay } from '../primitives/InkJarDisplay'
import { cauldronSprite } from '../assets/displayImages'
import { TickingNumber } from '../primitives/TickingNumber'

type CombatScreenProps = Readonly<{
  state: GameState
  enqueue: (action: PlayerAction) => void
}>

export function CombatScreen(props: CombatScreenProps) {
  const { state, enqueue } = props
  const combat = state.combat
  if (!combat) return null

  const handSelection = combat.handSelection
  const handSelectionModalOpen = state.phase === 'COMBAT_SELECT_HAND_CARD' && !!handSelection
  const handSelectionVerb = handSelection?.kind === 'CONSUME_SELECTED_CARD' ? 'Consume' : 'Upgrade'
  const handSelectionMaxPicks = handSelection ? Math.min(handSelection.numberOfTargets, handSelection.eligibleIds.length) : 0
  const handSelectionChosenCount = handSelection?.chosenIds.length ?? 0
  const handSelectionCanSubmit = !!handSelection && handSelectionChosenCount > 0
  const handVisible = state.phase !== 'COMBAT_SELECT_HAND_CARD'
  const { playCastBurst } = useCastBurst()
  const pendingCastSlotRef = useRef<HTMLElement | null>(null)
  const { registerHandSlot, isHandCardHidden, getHandSlotEl } = useCombatHandDrawAnimations({
    handIds: state.player.deck.hand,
    cardById: state.player.deck.cardById,
    power: state.player.power,
    firepowerMultiplier: state.player.firepowerMultiplier,
    enabled: handVisible,
  })

  useEffect(() => {
    if (!handSelectionModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') enqueue({ type: 'COMBAT/CANCEL_HAND_SELECTION' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handSelectionModalOpen, enqueue])

  return (
    <div className="combatArena">
      {handSelectionModalOpen && handSelection && (
        <div className="handSelectionOverlay">
          <div className="handSelectionPanel">
            <div className="handSelectionTitle">
              {handSelectionVerb} {handSelection.numberOfTargets > 1 ? 'up to ' : ''}
              {handSelection.numberOfTargets} card(s)
            </div>
            {handSelectionMaxPicks - handSelectionChosenCount > 0 ? (
              <div className="handSelectionSub">
                Choose {handSelection.numberOfTargets > 1 ? 'up to ' : ''}
                {handSelectionMaxPicks - handSelectionChosenCount} more
                {handSelection.numberOfTargets > 1 ? ', or submit your current choice.' : '.'}
              </div>
            ) : handSelectionChosenCount > 0 ? (
              <div className="handSelectionSub">Submit to confirm.</div>
            ) : null}
            <div className="handSelectionActions">
              <button
                type="button"
                className="handSelectionCancel"
                onClick={() => {
                  pendingCastSlotRef.current = null
                  enqueue({ type: 'COMBAT/CANCEL_HAND_SELECTION' })
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="handSelectionSubmit"
                disabled={!handSelectionCanSubmit}
                onClick={() => {
                  if (!handSelectionCanSubmit) return
                  const anchor = pendingCastSlotRef.current
                  if (anchor) playCastBurst(anchor)
                  pendingCastSlotRef.current = null
                  enqueue({ type: 'COMBAT/SUBMIT_HAND_SELECTION' })
                }}
              >
                Submit ({handSelectionChosenCount})
              </button>
            </div>
            <div className="handSelectionHand">
              {handSelection.eligibleIds.map((cid, idx) => {
                const inst = state.player.deck.cardById[cid]
                const t = inst ? Cards[inst.templateId] : undefined
                const chosen = handSelection.chosenIds.includes(cid)
                const picksLeft = handSelectionMaxPicks - handSelectionChosenCount
                const canInteract = chosen || picksLeft > 0
                return (
                  <GameCardView
                    key={`pick-${idx}-${cid}`}
                    cardInstanceId={cid}
                    inst={inst}
                    template={t}
                    power={state.player.power}
                    firepowerMultiplier={state.player.firepowerMultiplier}
                    disabled={!chosen && picksLeft <= 0}
                    selected={chosen}
                    className="handSelectionCard"
                    onClick={() => {
                      if (!canInteract) return
                      enqueue({ type: 'COMBAT/PICK_HAND_SELECTION_CARD', cardInstanceId: cid })
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bunnyMeter">
        <div className="bunnyMeterCauldron" role="status" aria-label={`Bunnies ${state.player.bunnies}`}>
          <img className="bunnyMeterCauldron__art" src={cauldronSprite} alt="" draggable={false} />
          <div className="bunnyMeterValue" aria-hidden>
            <TickingNumber value={state.player.bunnies} />
          </div>
        </div>
        <button
          type="button"
          className="btn bunnyMeterEndTurn"
          disabled={state.phase !== 'COMBAT_PLAYER_READY'}
          onClick={() => enqueue({ type: 'COMBAT/END_TURN' })}
        >
          End Turn
        </button>
      </div>

      <div className="footerRow">
        <InkJarDisplay current={state.player.energy} max={combatEffectiveMaxEnergy(state)} />
      </div>

      {handVisible ? (
        <div className="handRow handFan">
          <CombatHandFan
            onSlotRef={(key, el) => {
              const match = /^hand-\d+-(.+)$/.exec(key)
              if (match) registerHandSlot(match[1], el)
            }}
            slots={state.player.deck.hand.map((cid, idx) => {
              const inst = state.player.deck.cardById[cid]
              const t = inst ? Cards[inst.templateId] : undefined
              const canPlay = !!inst && !!t && cardInstanceIsPlayable(inst, t, state.player.energy)
              const hidden = isHandCardHidden(cid)
              return {
                key: `hand-${idx}-${cid}`,
                exhausted: inst?.exhausted,
                node: (
                  <GameCardView
                    cardInstanceId={cid}
                    inst={inst}
                    template={t}
                    power={state.player.power}
                    firepowerMultiplier={state.player.firepowerMultiplier}
                    disabled={!canPlay}
                    className={hidden ? 'gameCard--traveling' : undefined}
                    onClick={() => {
                      if (!inst || !t || !canPlay || hidden) return
                      const slotEl = getHandSlotEl(cid)
                      if (cardInstanceOpensHandSelection(inst)) {
                        pendingCastSlotRef.current = slotEl
                      } else if (slotEl) {
                        playCastBurst(slotEl)
                      }
                      enqueue({ type: 'COMBAT/PLAY_CARD', cardInstanceId: cid })
                    }}
                  />
                ),
              }
            })}
          />
        </div>
      ) : null}

      {combat.enemies.aliveIds.map((id) => {
        const e = combat.enemies.enemyById[id]
        const tmpl = Enemies[e.templateId]
        const boonPrefix = (e.boons ?? [])
          .map((b) => EnemyBoons[b]?.name ?? '')
          .filter((s) => !!s)
          .join(' ')
        const intent = e.intent ? describeEnemyIntent(e.intent, e.strength) : '…'
        const selected = combat.targeting.selectedEnemyId === id
        return (
          <div key={id} className={`unit enemyUnit ${selected ? 'enemyUnitSelected' : ''}`}>
            <div className="unitTitle">{`${boonPrefix ? `${boonPrefix} ` : ''}${tmpl?.name ?? e.templateId}`}</div>
            {e.strength > 0 ? (
              <div className="enemyStrengthLine" role="status" aria-label={`Strength ${e.strength}`}>
                Strength {e.strength}
              </div>
            ) : null}
            <div className="unitStats enemyUnitStats">
              <div>
                HP: {e.hp}/{e.maxHp}
                {e.shield > 0 ? <> Shield: {e.shield}</> : null}
                {e.lockedShield > 0 ? <> Locked shield: {e.lockedShield}</> : null}
              </div>
              <div>Intent: {intent}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
