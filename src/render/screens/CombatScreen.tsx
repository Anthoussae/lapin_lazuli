import { Fragment, useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import type { GameAction } from '../../reducers/actions'
import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../../reducers/actions'
import { Cards } from '../../data/cards'
import { Enemies } from '../../data/enemies'
import { EnemyBoons } from '../../data/enemyBoons'
import { combatEffectiveMaxEnergy } from '../../systems/combat/zones'
import { cardInstanceOpensHandSelection } from '../../systems/cards/cardEffects'
import { cardInstanceIsPlayable, handHasPlayableCard } from '../../systems/cards/inkCost'
import { useCastBurst } from '../CastBurstContext'
import { useCardConsume } from '../CardConsumeContext'
import { cardInstanceConsumes } from '../../systems/cards/cardEffects'
import { useBunnyRelease } from '../BunnyReleaseContext'
import { useTriggerFxArtProps } from '../TriggerFxContext'
import { useFireRelease } from '../FireReleaseContext'
import { cardInstanceHasFireDamage, fireCardPlayDamage } from '../../systems/cards/fireRelease'
import { combatHandFanContainerStyle } from '../combatHandFanLayout'
import { CombatHandFan } from '../primitives/CombatHandFan'
import { useCombatHandDrawAnimations } from '../hooks/useCombatHandDrawAnimations'
import { GameCardView } from '../primitives/GameCardView'
import { InspectPileCloseButton } from '../primitives/InspectPileCloseButton'
import { BarHud } from '../primitives/BarHud'
import { InkJarDisplay } from '../primitives/InkJarDisplay'
import { plainGreyBackdropCombat } from '../assets/backdropImages'
import { cauldronSprite, playerPlaceholderSprite } from '../assets/displayImages'
import { CombatEnemyBarHud } from '../primitives/CombatEnemyBarHud'
import { CombatEnemyIntentDisplay } from '../primitives/CombatEnemyIntentDisplay'
import { CombatMonsterPlaceholder } from '../primitives/CombatMonsterPlaceholder'
import { MonsterDefeatPoof } from '../primitives/MonsterDefeatPoof'
import { TickingNumber } from '../primitives/TickingNumber'
import { relicTooltipViewportPosition } from '../relicTooltipPosition'
import { GameTooltipStack } from '../primitives/GameTooltip'
import { bunnyReleaseTotalMs } from '../bunnyReleaseConfig'
import { monsterDefeatTotalMs } from '../monsterDefeatConfig'
import { previewEnemyAfterBunnyDamage } from '../../systems/combat/bunnyReleaseTarget'
import { canTakeCombatPlayerInput } from '../../systems/combat/combatInput'
import { hasPendingBurdenAdds } from '../../systems/combat/burdenAdd'
import { effectiveFirepower, effectivePower, effectiveShieldPower } from '../../systems/combat/combatBonuses'
import { BurdenAddFx } from '../primitives/BurdenAddFx'
import { CombatTargetHoverHost } from '../primitives/CombatTargetHoverHost'
import {
  EnchantmentGlowRings,
  enchantmentStacksForTarget,
  enchantmentTooltipEntries,
} from '../primitives/EnchantmentGlowRings'

type CombatScreenProps = Readonly<{
  state: GameState
  enqueue: (action: PlayerAction) => void
  dispatch: (action: GameAction) => void
  onCompleteTurnStartDraw: () => void
}>

/** Default combat hotkey for ending the player turn. */
const COMBAT_END_TURN_HOTKEY = ' '

function shouldCombatEndTurnHotkey(
  e: KeyboardEvent,
  state: GameState,
  handSelectionModalOpen: boolean,
  fireReleasePlaying: boolean,
): boolean {
  if (e.key !== COMBAT_END_TURN_HOTKEY || e.repeat) return false
  if (handSelectionModalOpen || fireReleasePlaying) return false
  if (!canTakeCombatPlayerInput(state)) return false
  if (e.defaultPrevented) return false

  const target = e.target
  if (!(target instanceof HTMLElement)) return true

  if (target.closest('.inspectDeckOverlay, .handSelectionOverlay')) return false
  if (target.isContentEditable) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false
  if (target.closest('.gameCard--clickable, button, [role="button"]')) return false

  return true
}

export function CombatScreen(props: CombatScreenProps) {
  const { state, enqueue, dispatch, onCompleteTurnStartDraw } = props
  const combat = state.combat
  if (!combat) return null

  const power = effectivePower(state)
  const firepower = effectiveFirepower(state)
  const shieldPower = effectiveShieldPower(state)

  const handSelection = combat.handSelection
  const handSelectionModalOpen = state.phase === 'COMBAT_SELECT_HAND_CARD' && !!handSelection
  const handSelectionVerb = handSelection?.kind === 'CONSUME_SELECTED_CARD' ? 'Consume' : 'Upgrade'
  const handSelectionMaxPicks = handSelection ? Math.min(handSelection.numberOfTargets, handSelection.eligibleIds.length) : 0
  const handSelectionChosenCount = handSelection?.chosenIds.length ?? 0
  const handSelectionCanSubmit = !!handSelection && handSelectionChosenCount > 0
  const handVisible = state.phase !== 'COMBAT_SELECT_HAND_CARD'
  const bunnyReleaseAnimating = combat.bunnyReleasePending
  const bunnyReleaseTickMs = bunnyReleaseTotalMs()
  const { playCastBurst } = useCastBurst()
  const { playCardConsume } = useCardConsume()
  const {
    playFireRelease,
    playerPlaceholderRef,
    registerLeapTarget: registerFireLeapTarget,
    isFireReleasePlaying,
  } = useFireRelease()
  const selectedEnemyId = combat.targeting.selectedEnemyId
  const { cauldronRef, registerLeapTarget } = useBunnyRelease()
  const cauldronFx = useTriggerFxArtProps({ kind: 'cauldron' })
  const pendingCastSlotRef = useRef<HTMLElement | null>(null)
  const handSelectionSlotRefs = useRef(new Map<string, HTMLElement>())
  const { registerHandSlot, isHandCardHidden, getHandSlotEl, visualHandIds } = useCombatHandDrawAnimations({
    handIds: state.player.deck.hand,
    discardPileIds: state.player.deck.discardPile,
    cardById: state.player.deck.cardById,
    power,
    firepower,
    firepowerMultiplier: state.player.firepowerMultiplier,
    shieldPower,
    freeFirstFireSpell: combat.freeFirstFireSpell,
    nextSpellCosts0: combat.nextSpellCosts0,
    enabled: handVisible,
    pendingTurnStartDraw: combat.pendingTurnStartDraw,
    burdenAddsBlocking: hasPendingBurdenAdds(state),
    onCompleteTurnStartDraw,
  })

  const [endTurnTooltipPos, setEndTurnTooltipPos] = useState<null | { x: number; y: number }>(null)
  const placeEndTurnTooltip = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    setEndTurnTooltipPos(relicTooltipViewportPosition(e.currentTarget.getBoundingClientRect()))
  }, [])
  const clearEndTurnTooltip = useCallback(() => setEndTurnTooltipPos(null), [])

  const handHasPlayable =
    handVisible &&
    handHasPlayableCard(
      state.player.deck.hand,
      state.player.deck.cardById,
      (templateId) => Cards[templateId],
      state.player.energy,
      { freeFirstFireSpell: combat.freeFirstFireSpell, nextSpellCosts0: combat.nextSpellCosts0 },
    )
  const canEndTurn = canTakeCombatPlayerInput(state) && !isFireReleasePlaying
  const endTurnNudgeGlow = canEndTurn && handVisible && !handHasPlayable
  const monsterDefeatPendingId = combat.monsterDefeatPending
  const playerDefeatPending = combat.playerDefeatPending
  const playerEnchantmentStacks = enchantmentStacksForTarget(
    combat.enchantments.filter((e) => e.target.kind === 'PLAYER'),
    firepower,
    state.player.firepowerMultiplier,
    state.player.relics.some((r) => r.templateId === 'GREEN_HAT'),
  )

  useEffect(() => {
    if (!monsterDefeatPendingId) return
    const holdMs = monsterDefeatTotalMs()
    const id = window.setTimeout(() => {
      dispatch({ type: 'COMBAT/COMPLETE_MONSTER_DEFEAT' })
    }, holdMs)
    return () => window.clearTimeout(id)
  }, [monsterDefeatPendingId, dispatch])

  useEffect(() => {
    if (!playerDefeatPending) return
    const holdMs = monsterDefeatTotalMs()
    const id = window.setTimeout(() => {
      dispatch({ type: 'COMBAT/COMPLETE_PLAYER_DEFEAT' })
    }, holdMs)
    return () => window.clearTimeout(id)
  }, [playerDefeatPending, dispatch])

  useEffect(() => {
    if (!handSelectionModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') enqueue({ type: 'COMBAT/CANCEL_HAND_SELECTION' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handSelectionModalOpen, enqueue])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!shouldCombatEndTurnHotkey(e, state, handSelectionModalOpen, isFireReleasePlaying)) return
      e.preventDefault()
      enqueue({ type: 'COMBAT/END_TURN' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state, handSelectionModalOpen, isFireReleasePlaying, enqueue])

  const cancelHandSelection = useCallback(() => {
    pendingCastSlotRef.current = null
    handSelectionSlotRefs.current.clear()
    enqueue({ type: 'COMBAT/CANCEL_HAND_SELECTION' })
  }, [enqueue])

  const playHandSelectionConsumes = useCallback(() => {
    if (!handSelection || handSelection.kind !== 'CONSUME_SELECTED_CARD') return
    for (const cid of handSelection.chosenIds) {
      const el = handSelectionSlotRefs.current.get(cid)
      if (el)
        playCardConsume({
          cardInstanceId: cid,
          sourceEl: el,
          hostClassName: 'cardConsumeHost--combat',
        })
    }
    const playedInst = state.player.deck.cardById[handSelection.playedCardInstanceId]
    if (playedInst && cardInstanceConsumes(playedInst)) {
      const anchor = pendingCastSlotRef.current
      if (anchor) {
        playCardConsume({
          cardInstanceId: handSelection.playedCardInstanceId,
          sourceEl: anchor,
          hostClassName: 'cardConsumeHost--combat',
        })
      }
    }
  }, [handSelection, playCardConsume, state.player.deck.cardById])

  return (
    <>
      <div className="screenBackdrop screenBackdrop--combat" aria-hidden>
        <img className="screenBackdrop__img" src={plainGreyBackdropCombat} alt="" draggable={false} />
      </div>
      <div className="combatArena">
      {handSelectionModalOpen && handSelection && (
        <div className="handSelectionOverlay">
          <div className="handSelectionPanel">
            <InspectPileCloseButton active={handSelectionModalOpen} onClose={cancelHandSelection} />
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
                className="handSelectionSubmit"
                disabled={!handSelectionCanSubmit}
                onClick={() => {
                  if (!handSelectionCanSubmit) return
                  const anchor = pendingCastSlotRef.current
                  if (anchor) playCastBurst(anchor)
                  playHandSelectionConsumes()
                  pendingCastSlotRef.current = null
                  handSelectionSlotRefs.current.clear()
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
                  <div
                    key={`pick-${idx}-${cid}`}
                    className="handSelectionCardSlot"
                    ref={(el) => {
                      if (el) handSelectionSlotRefs.current.set(cid, el)
                      else handSelectionSlotRefs.current.delete(cid)
                    }}
                  >
                    <GameCardView
                      cardInstanceId={cid}
                      inst={inst}
                      template={t}
                      power={power}
                      firepower={firepower}
                      firepowerMultiplier={state.player.firepowerMultiplier}
                      shieldPower={shieldPower}
                  hasGreenHat={state.player.relics.some((r) => r.templateId === 'GREEN_HAT')}
                      disabled={!chosen && picksLeft <= 0}
                      selected={chosen}
                      className="handSelectionCard"
                      onClick={() => {
                        if (!canInteract) return
                        enqueue({ type: 'COMBAT/PICK_HAND_SELECTION_CARD', cardInstanceId: cid })
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bunnyMeter">
        <BarHud state={state} inCombat className="combatPlayerBarHud" />
        <CombatTargetHoverHost enchantmentEntries={enchantmentTooltipEntries(playerEnchantmentStacks)}>
          <div
            className={[
              'combatPlayerPlaceholder',
              playerEnchantmentStacks.length ? 'combatPlayerPlaceholder--hasEnchantments' : null,
              playerDefeatPending ? 'combatPlayerPlaceholder--defeating' : null,
            ]
              .filter(Boolean)
              .join(' ')}
            ref={playerPlaceholderRef}
            role="img"
            aria-label="Player"
          >
            {playerDefeatPending ? <MonsterDefeatPoof /> : null}
            <EnchantmentGlowRings stacks={playerEnchantmentStacks} />
            <img className="combatPlayerPlaceholder__art" src={playerPlaceholderSprite} alt="" draggable={false} />
          </div>
        </CombatTargetHoverHost>
        <div className="bunnyMeterCauldron" ref={cauldronRef} role="status" aria-label={`Bunnies ${state.player.bunnies}`}>
          <img
            key={cauldronFx.key}
            className={['bunnyMeterCauldron__art', cauldronFx.className].filter(Boolean).join(' ')}
            src={cauldronSprite}
            alt=""
            draggable={false}
          />
          <div className="bunnyMeterValue" aria-hidden>
            <TickingNumber
              value={bunnyReleaseAnimating ? 0 : state.player.bunnies}
              durationMs={bunnyReleaseTickMs}
            />
          </div>
        </div>
        <button
          type="button"
          className={`btn bunnyMeterEndTurn${endTurnNudgeGlow ? ' bunnyMeterEndTurn--nudge' : ''}`}
          disabled={!canEndTurn}
          onClick={() => {
            if (!canEndTurn) return
            enqueue({ type: 'COMBAT/END_TURN' })
          }}
          onMouseEnter={placeEndTurnTooltip}
          onMouseMove={placeEndTurnTooltip}
          onMouseLeave={clearEndTurnTooltip}
        >
          End Turn
        </button>
        {endTurnTooltipPos ? (
          <GameTooltipStack
            entries={[{ key: 'end-turn', label: 'Release the bunnies!' }]}
            x={endTurnTooltipPos.x}
            y={endTurnTooltipPos.y}
            anchor="topCenter"
          />
        ) : null}
      </div>

      <div className="footerRow">
        <InkJarDisplay current={state.player.energy} max={combatEffectiveMaxEnergy(state)} />
      </div>

      {handVisible ? (
        <div className="handRow handFan" style={combatHandFanContainerStyle(visualHandIds.length)}>
          <CombatHandFan
            onSlotRef={(key, el) => {
              const match = /^hand-\d+-(.+)$/.exec(key)
              if (match) registerHandSlot(match[1], el)
            }}
            slots={visualHandIds.map((cid, idx) => {
              const inst = state.player.deck.cardById[cid]
              const t = inst ? Cards[inst.templateId] : undefined
              const inHand = state.player.deck.hand.includes(cid)
              const inkOpts = { freeFirstFireSpell: combat.freeFirstFireSpell, nextSpellCosts0: combat.nextSpellCosts0 }
              const canPlay =
                inHand && !!inst && !!t && cardInstanceIsPlayable(inst, t, state.player.energy, inkOpts)
              const hidden = isHandCardHidden(cid)
              return {
                key: `hand-${idx}-${cid}`,
                exhausted: inst?.exhausted,
                node: (
                  <GameCardView
                    cardInstanceId={cid}
                    inst={inst}
                    template={t}
                    power={power}
                    firepower={firepower}
                    firepowerMultiplier={state.player.firepowerMultiplier}
                    shieldPower={shieldPower}
                    hasGreenHat={state.player.relics.some((r) => r.templateId === 'GREEN_HAT')}
                    freeFirstFireSpell={combat.freeFirstFireSpell}
                      nextSpellCosts0={combat.nextSpellCosts0}
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
                      if (t && cardInstanceHasFireDamage(inst, t.tags)) {
                        playFireRelease(
                          fireCardPlayDamage(inst, t.tags, firepower, state.player.firepowerMultiplier),
                        )
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
        const bunnyReleaseTarget = bunnyReleaseAnimating && combat.bunnyReleaseTargetEnemyId === id
        const bunnyDmg = bunnyReleaseTarget ? Math.max(0, state.player.bunnies) : 0
        const afterBunnies = bunnyReleaseTarget
          ? previewEnemyAfterBunnyDamage(e.shield, e.lockedShield, e.hp, bunnyDmg)
          : null
        const displayHp = afterBunnies?.hp ?? e.hp
        const displayShield = afterBunnies?.shield ?? e.shield
        const displayLockedShield = afterBunnies?.lockedShield ?? e.lockedShield
        const displayName = tmpl?.name ?? e.templateId
        const displayTitle = `${boonPrefix ? `${boonPrefix} ` : ''}${displayName}`
        const defeating = monsterDefeatPendingId === id
        const enemyEnchantmentStacks = enchantmentStacksForTarget(
          combat.enchantments.filter((ench) => ench.target.kind === 'ENEMY' && ench.target.enemyInstanceId === id),
          0,
          0,
          state.player.relics.some((r) => r.templateId === 'GREEN_HAT'),
        )
        return (
          <Fragment key={id}>
            <CombatMonsterPlaceholder
              name={displayTitle}
              spriteName={displayName}
              enemyInstanceId={id}
              boonIds={e.boons ?? []}
              enchantmentStacks={enemyEnchantmentStacks}
              defeating={defeating}
            />
            {!defeating ? (
              <>
                <CombatEnemyIntentDisplay intent={e.intent} strength={e.strength} />
                <CombatEnemyBarHud
                  hp={displayHp}
                  maxHp={e.maxHp}
                  shield={displayShield}
                  lockedShield={displayLockedShield}
                  durationMs={bunnyReleaseTickMs}
                  leapTargetRef={
                    bunnyReleaseTarget
                      ? (el) => registerLeapTarget(id, el)
                      : selectedEnemyId === id
                        ? (el) => registerFireLeapTarget(id, el)
                        : undefined
                  }
                />
              </>
            ) : null}
          </Fragment>
        )
      })}
      <BurdenAddFx state={state} dispatch={dispatch} />
      </div>
    </>
  )
}
