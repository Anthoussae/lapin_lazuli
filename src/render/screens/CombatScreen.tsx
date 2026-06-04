import { Fragment, useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import type { GameAction } from '../../reducers/actions'
import type { GameState } from '../../core/types/state'
import type { PlayerAction } from '../../reducers/actions'
import { Cards } from '../../data/cards'
import { Enemies } from '../../data/enemies'
import { EnemyBoons } from '../../data/enemyBoons'
import { combatEffectiveMaxEnergy } from '../../systems/combat/zones'
import { cardInstanceOpensHandSelection } from '../../systems/cards/cardEffects'
import { cardInstanceIsPlayable, cardInstanceLooksExhausted, handHasPlayableCard } from '../../systems/cards/inkCost'
import { useCastBurst } from '../CastBurstContext'
import { useCardConsume } from '../CardConsumeContext'
import { cardInstanceConsumes } from '../../systems/cards/cardEffects'
import { useBunnyRelease } from '../BunnyReleaseContext'
import { useTriggerFxArtProps } from '../TriggerFxContext'
import { useCriticalFxAnchors, useCriticalFxShakeClass } from '../CriticalFxContext'
import { useDodgeFxAnchors, useDodgeFxWiggleClass } from '../DodgeFxContext'
import { usePlayerHitFxClass } from '../PlayerHitFxContext'
import { usePoisonCardHitFxAnchors } from '../PoisonCardHitFxContext'
import { useFireDamageHitFxAnchors } from '../FireDamageHitFxContext'
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
import { lethalHpDrainBeforeKnockoutMs } from '../lethalHpDrainConfig'
import { monsterDefeatTotalMs } from '../monsterDefeatConfig'
import type { EnemyInstanceId } from '../../core/types/ids'
import { previewEnemyAfterBunnyRelease } from '../../systems/combat/bunnyReleaseTarget'
import { canTakeCombatPlayerInput } from '../../systems/combat/combatInput'
import { hasPendingBurdenAdds } from '../../systems/combat/burdenAdd'
import { powerDisplayContextFromState } from '../../systems/combat/powerDisplay'
import { BurdenAddFx } from '../primitives/BurdenAddFx'
import { CombatTargetHoverHost } from '../primitives/CombatTargetHoverHost'
import {
  EnchantmentVisuals,
  enchantmentStacksForTarget,
  enchantmentTooltipEntries,
  hasFireCrownEnchantmentOverlay,
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

  const powerDisplay = powerDisplayContextFromState(state)

  const handSelection = combat.handSelection
  const handSelectionModalOpen = state.phase === 'COMBAT_SELECT_HAND_CARD' && !!handSelection
  const handSelectionIsConsume = handSelection?.kind === 'CONSUME_SELECTED_CARD'
  const handSelectionVerb = handSelectionIsConsume ? 'Consume' : 'Upgrade'
  const handSelectionMaxPicks = handSelection ? Math.min(handSelection.numberOfTargets, handSelection.eligibleIds.length) : 0
  const handSelectionChosenCount = handSelection?.chosenIds.length ?? 0
  const handSelectionCanSubmit = !!handSelection && (handSelectionIsConsume || handSelectionChosenCount > 0)
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
  const { registerCauldronAnchor, registerPlayerAnchor, registerEnemyAnchor } = useCriticalFxAnchors()
  const { registerPlayerAnchor: registerDodgePlayerAnchor } = useDodgeFxAnchors()
  const {
    registerPlayerAnchor: registerPoisonCardHitPlayerAnchor,
    registerEnemyAnchor: registerPoisonCardHitEnemyAnchor,
  } = usePoisonCardHitFxAnchors()
  const {
    registerPlayerAnchor: registerFireDamageHitPlayerAnchor,
    registerEnemyAnchor: registerFireDamageHitEnemyAnchor,
  } = useFireDamageHitFxAnchors()
  const cauldronCritShake = useCriticalFxShakeClass('bunnies')
  const playerCritShake = useCriticalFxShakeClass('shield')
  const playerDodgeWiggle = useDodgeFxWiggleClass()
  const playerHitFx = usePlayerHitFxClass()
  const enemyCritShake = useCriticalFxShakeClass('attack')
  const cauldronFx = useTriggerFxArtProps({ kind: 'cauldron' })
  const pendingCastSlotRef = useRef<HTMLElement | null>(null)
  const handSelectionSlotRefs = useRef(new Map<string, HTMLElement>())
  const { registerHandSlot, isHandCardHidden, getHandSlotEl, visualHandIds } = useCombatHandDrawAnimations({
    handIds: state.player.deck.hand,
    discardPileIds: state.player.deck.discardPile,
    cardById: state.player.deck.cardById,
    powerDisplay,
    gameLevel: state.level,
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
  const lethalHpDrainMs = lethalHpDrainBeforeKnockoutMs()
  const [monsterKnockoutId, setMonsterKnockoutId] = useState<EnemyInstanceId | null>(null)
  const [playerKnockoutPlaying, setPlayerKnockoutPlaying] = useState(false)
  const playerEnchantmentStacks = enchantmentStacksForTarget(
    combat.enchantments.filter((e) => e.target.kind === 'PLAYER'),
    powerDisplay,
  )

  useEffect(() => {
    if (!monsterDefeatPendingId) {
      setMonsterKnockoutId(null)
      return
    }
    setMonsterKnockoutId(null)
    const id = window.setTimeout(() => setMonsterKnockoutId(monsterDefeatPendingId), lethalHpDrainMs)
    return () => window.clearTimeout(id)
  }, [monsterDefeatPendingId, lethalHpDrainMs])

  useEffect(() => {
    if (!monsterDefeatPendingId) return
    const holdMs = lethalHpDrainMs + monsterDefeatTotalMs()
    const id = window.setTimeout(() => {
      dispatch({ type: 'COMBAT/COMPLETE_MONSTER_DEFEAT' })
    }, holdMs)
    return () => window.clearTimeout(id)
  }, [monsterDefeatPendingId, lethalHpDrainMs, dispatch])

  useEffect(() => {
    if (!playerDefeatPending) {
      setPlayerKnockoutPlaying(false)
      return
    }
    setPlayerKnockoutPlaying(false)
    const id = window.setTimeout(() => setPlayerKnockoutPlaying(true), lethalHpDrainMs)
    return () => window.clearTimeout(id)
  }, [playerDefeatPending, lethalHpDrainMs])

  useEffect(() => {
    if (!playerDefeatPending) return
    const holdMs = lethalHpDrainMs + monsterDefeatTotalMs()
    const id = window.setTimeout(() => {
      dispatch({ type: 'COMBAT/COMPLETE_PLAYER_DEFEAT' })
    }, holdMs)
    return () => window.clearTimeout(id)
  }, [playerDefeatPending, lethalHpDrainMs, dispatch])

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
              {handSelectionVerb}{' '}
              {handSelectionIsConsume || handSelection.numberOfTargets > 1 ? 'up to ' : ''}
              {handSelection.numberOfTargets} card(s)
            </div>
            {handSelectionIsConsume ? (
              handSelectionMaxPicks <= 0 ? (
                <div className="handSelectionSub">No other cards to consume. Submit to cast.</div>
              ) : handSelectionChosenCount > 0 && handSelectionMaxPicks - handSelectionChosenCount <= 0 ? (
                <div className="handSelectionSub">Submit to confirm.</div>
              ) : (
                <div className="handSelectionSub">
                  Choose {handSelection.numberOfTargets > 1 ? 'up to ' : ''}
                  {handSelectionMaxPicks - handSelectionChosenCount} card(s), or submit without consuming any.
                </div>
              )
            ) : handSelectionMaxPicks - handSelectionChosenCount > 0 ? (
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
                    className="handSelectionCardSlot gameCardHoverHost"
                    ref={(el) => {
                      if (el) handSelectionSlotRefs.current.set(cid, el)
                      else handSelectionSlotRefs.current.delete(cid)
                    }}
                  >
                    <GameCardView
                      cardInstanceId={cid}
                      inst={inst}
                      template={t}
                      powerDisplay={powerDisplay}
                      gameLevel={state.level}
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
        <BarHud
          state={state}
          inCombat
          className="combatPlayerBarHud"
          hpTickDurationMs={playerDefeatPending ? lethalHpDrainMs : undefined}
        />
        <CombatTargetHoverHost
          enchantmentEntries={enchantmentTooltipEntries(playerEnchantmentStacks)}
          className={[
            'combatPlayerPlaceholder',
            playerEnchantmentStacks.length ? 'combatPlayerPlaceholder--hasEnchantments' : null,
            hasFireCrownEnchantmentOverlay(playerEnchantmentStacks)
              ? 'combatPlayerPlaceholder--fireCrownAboveBar'
              : null,
            playerKnockoutPlaying ? 'combatPlayerPlaceholder--defeating' : null,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div
            ref={(el) => {
              playerPlaceholderRef.current = el
              registerPlayerAnchor(el)
              registerDodgePlayerAnchor(el)
              registerPoisonCardHitPlayerAnchor(el)
              registerFireDamageHitPlayerAnchor(el)
            }}
            className="combatPlaceholderAnchor"
            role="img"
            aria-label="Player"
          >
            {playerKnockoutPlaying ? <MonsterDefeatPoof /> : null}
            <img
              key={`${playerCritShake.key}-${playerDodgeWiggle.key}-${playerHitFx.key}`}
              className={[
                'combatPlayerPlaceholder__art',
                playerCritShake.className,
                playerDodgeWiggle.className,
                playerHitFx.className,
              ]
                .filter(Boolean)
                .join(' ')}
              src={playerPlaceholderSprite}
              alt=""
              draggable={false}
            />
            <EnchantmentVisuals
              stacks={playerEnchantmentStacks}
              anchorRef={playerPlaceholderRef}
              spriteTriggerTarget={{ kind: 'player' }}
            />
          </div>
        </CombatTargetHoverHost>
        <div
          className="bunnyMeterCauldron"
          ref={(el) => {
            cauldronRef.current = el
            registerCauldronAnchor(el)
          }}
          role="status"
          aria-label={`Bunnies ${state.player.bunnies}`}
        >
          <img
            key={`${cauldronFx.key}-${cauldronCritShake.key}`}
            className={['bunnyMeterCauldron__art', cauldronFx.className, cauldronCritShake.className]
              .filter(Boolean)
              .join(' ')}
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
                exhausted: inst ? cardInstanceLooksExhausted(inst) : false,
                node: (
                  <GameCardView
                    cardInstanceId={cid}
                    inst={inst}
                    template={t}
                    handCardTriggerFx
                    powerDisplay={powerDisplay}
                    gameLevel={state.level}
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
                          fireCardPlayDamage(
                            inst,
                            t.tags,
                            powerDisplay.firepower,
                            powerDisplay.firepowerMultiplier,
                          ),
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
        const rawBunnyDmg = bunnyReleaseTarget ? Math.max(0, state.player.bunnies) : 0
        const afterBunnies = bunnyReleaseTarget
          ? previewEnemyAfterBunnyRelease(state, id, e.shield, e.lockedShield, e.hp, rawBunnyDmg)
          : null
        const displayHp = afterBunnies?.hp ?? e.hp
        const displayShield = afterBunnies?.shield ?? e.shield
        const displayLockedShield = afterBunnies?.lockedShield ?? e.lockedShield
        const displayName = tmpl?.name ?? e.templateId
        const displayTitle = `${boonPrefix ? `${boonPrefix} ` : ''}${displayName}`
        const knockoutPlaying = monsterKnockoutId === id
        const hpDrainPending = monsterDefeatPendingId === id && !knockoutPlaying
        const enemyEnchantmentStacks = enchantmentStacksForTarget(
          combat.enchantments.filter((ench) => ench.target.kind === 'ENEMY' && ench.target.enemyInstanceId === id),
          powerDisplay,
        )
        return (
          <Fragment key={id}>
            <CombatMonsterPlaceholder
              name={displayTitle}
              sprite={tmpl?.sprite}
              color={tmpl?.color}
              enemyInstanceId={id}
              boonIds={e.boons ?? []}
              enemyLevel={tmpl?.level ?? 0}
              strength={e.strength}
              enchantmentStacks={enemyEnchantmentStacks}
              defeating={knockoutPlaying}
              registerCriticalAnchor={selectedEnemyId === id ? registerEnemyAnchor : undefined}
              registerPoisonCardHitAnchor={(el) => registerPoisonCardHitEnemyAnchor(id, el)}
              registerFireDamageHitAnchor={(el) => registerFireDamageHitEnemyAnchor(id, el)}
              criticalShake={selectedEnemyId === id ? enemyCritShake : undefined}
            />
            {!knockoutPlaying ? (
              <>
                {monsterDefeatPendingId !== id ? (
                  <CombatEnemyIntentDisplay
                    state={state}
                    enemyInstanceId={id}
                    intent={e.intent}
                    strength={e.strength}
                  />
                ) : null}
                <CombatEnemyBarHud
                  enemyInstanceId={id}
                  hp={displayHp}
                  maxHp={e.maxHp}
                  shield={displayShield}
                  lockedShield={displayLockedShield}
                  durationMs={hpDrainPending ? lethalHpDrainMs : bunnyReleaseTickMs}
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
