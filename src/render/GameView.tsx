import { useEffect, useState } from 'react'
import type { GameState, PathCombatPreview } from '../core/types/state'
import type { GameAction, PlayerAction } from '../reducers/actions'
import { Relics } from '../data/relics'
import { Paths } from '../data/paths'
import { Cards } from '../data/cards'
import { Gems } from '../data/gems'
import { Enemies } from '../data/enemies'
import { EnemyBoons } from '../data/enemyBoons'
import { isCombatPath } from '../systems/paths/rollPathCombat'
import {
  combatHandDescriptionLinesForInstance,
  describeCardInstance,
  describeEffect,
  describeOfferedCardWithUpgrades,
  englishPlural,
  describeRelic,
  formatCardInstanceDisplayName,
  formatCardName,
} from '../ui/describe'
import { socketableDeckCards } from '../systems/gems/socketing'
import { combatEffectiveMaxEnergy } from '../systems/combat/zones'
import { cardInstanceInkCost, cardInstanceIsPlayable } from '../systems/cards/inkCost'

function pathCombatPreviewLabel(preview: PathCombatPreview): string {
  const tmpl = Enemies[preview.enemyTemplateId]
  const boonPrefix = preview.boons
    .map((b) => EnemyBoons[b]?.name ?? '')
    .filter((s) => !!s)
    .join(' ')
  const name = tmpl?.name ?? preview.enemyTemplateId
  const full = boonPrefix ? `${boonPrefix} ${name}` : name
  return `${full}, HP: ${preview.maxHp}`
}
import { describeEnemyIntent } from '../ui/describeEnemyIntent'
import './game.css'

function CombatHandCardDesc(props: Readonly<{ lines: ReturnType<typeof combatHandDescriptionLinesForInstance> }>) {
  const { lines } = props
  if (!lines.length) return null
  return (
    <div className="cardDesc cardDescCombatHand">
      {lines.map((line, i) =>
        line.kind === 'plain' ? (
          <div key={i} className="cardDescLine">
            {line.text}
          </div>
        ) : (
          <div key={i} className="cardDescLine">
            add{' '}
            <span
              className={
                line.displayAmount > line.baseAmount
                  ? 'handBunnyAmtUp'
                  : line.displayAmount < line.baseAmount
                    ? 'handBunnyAmtDown'
                    : undefined
              }
            >
              {line.displayAmount}
            </span>{' '}
            {englishPlural(line.displayAmount, 'bunny', 'bunnies')}.
          </div>
        ),
      )}
    </div>
  )
}

export function GameView(props: Readonly<{ state: GameState; dispatch: (a: GameAction) => void }>) {
  const { state, dispatch } = props

  const enqueue = (action: PlayerAction) => dispatch({ type: 'INPUT/INTENT_ENQUEUE', action })
  const [beltTip, setBeltTip] = useState<null | { text: string; x: number; y: number }>(null)
  const [deckOpen, setDeckOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  const inCombat = state.combat && (state.phase.startsWith('COMBAT_') || state.phase === 'ANIMATING')

  useEffect(() => {
    if (!deckOpen && !discardOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeckOpen(false)
        setDiscardOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deckOpen, discardOpen])

  const handSelection = state.combat?.handSelection
  const handSelectionModalOpen = state.phase === 'COMBAT_SELECT_HAND_CARD' && !!handSelection
  const handSelectionVerb = handSelection?.kind === 'CONSUME_SELECTED_CARD' ? 'Consume' : 'Upgrade'
  const handSelectionMaxPicks = handSelection ? Math.min(handSelection.numberOfTargets, handSelection.eligibleIds.length) : 0
  const handSelectionChosenCount = handSelection?.chosenIds.length ?? 0
  const handSelectionCanSubmit = !!handSelection && handSelectionChosenCount > 0

  const rewardGold = state.cardReward?.goldEarned ?? 0
  const rewardKeys = state.cardReward?.keysEarned ?? 0
  const rewardKind = state.cardReward?.kind

  const rewardLootEarned =
    rewardGold > 0 || rewardKeys > 0
      ? [
          rewardGold > 0 ? `${rewardGold} gold` : null,
          rewardKeys > 0 ? `${rewardKeys} key${rewardKeys === 1 ? '' : 's'}` : null,
        ]
          .filter(Boolean)
          .join(' and ')
      : ''

  useEffect(() => {
    if (!handSelectionModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'INPUT/INTENT_ENQUEUE', action: { type: 'COMBAT/CANCEL_HAND_SELECTION' } })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handSelectionModalOpen, dispatch])

  return (
    <>
      {state.phase !== 'TITLE' && (
        <div className="levelCounter">
          <div>Level: {state.level}</div>
          <div>
            Health: {state.player.hp}/{state.player.maxHp}
            {state.player.shield > 0 ? <> Shield: {state.player.shield}</> : null}
            {inCombat && state.player.lockedShield > 0 ? (
              <>
                {' '}
                Locked shield: <span className="playerLockedShield">{state.player.lockedShield}</span>
              </>
            ) : null}
          </div>
          <div>Keys: {state.player.keys}</div>
          <div>Gold: {state.player.gold}</div>
        </div>
      )}

      {state.phase !== 'TITLE' && (
        <>
          {inCombat && (
            <button className="inspectDiscardBtn btn" onClick={() => setDiscardOpen((v) => !v)}>
              Inspect Discard Pile
            </button>
          )}
          <button className="inspectDeckBtn btn" onClick={() => setDeckOpen((v) => !v)}>
            Inspect Deck
          </button>
        </>
      )}

      <div className="relicBeltRow">
        {state.player.relics.map((ri) => {
          const r = Relics[ri.templateId]
          return (
            <div
              key={ri.id}
              className="relicBeltItem"
              onMouseEnter={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const text = r ? describeRelic(r) : ri.templateId
                setBeltTip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 8 })
              }}
              onMouseMove={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const text = r ? describeRelic(r) : ri.templateId
                setBeltTip({ text, x: rect.left + rect.width / 2, y: rect.bottom + 8 })
              }}
              onMouseLeave={() => setBeltTip(null)}
            >
              {r?.thumb ?? '?'}
            </div>
          )
        })}
      </div>

      {beltTip && (
        <div className="beltTooltip" style={{ left: beltTip.x, top: beltTip.y }}>
          {beltTip.text}
        </div>
      )}

      {(deckOpen || discardOpen) && state.phase !== 'TITLE' && (
        <div className="inspectDeckOverlay">
          <div className="inspectDeckPanel">
            <button
              className="inspectDeckClose"
              onClick={() => {
                setDeckOpen(false)
                setDiscardOpen(false)
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="inspectDeckTitle">{discardOpen ? 'Discard pile' : 'Deck'}</div>
            <div className="inspectDeckList">
              {state.combat ? (
                <>
                  {(discardOpen ? state.player.deck.discardPile : state.player.deck.drawPile).map((cid, idx) => {
                    const inst = state.player.deck.cardById[cid]
                    const t = inst ? Cards[inst.templateId] : undefined
                    const desc = inst && t ? describeCardInstance(t, inst) : ''
                    return (
                      <div key={`pile-${idx}-${cid}`} className="inspectDeckRow">
                        <div className="inspectDeckRowHeader">
                          <div className="inspectDeckRowName">
                            {inst && t ? formatCardInstanceDisplayName(t, inst) : inst?.templateId ?? cid}
                          </div>
                          <div className="inspectDeckRowInk">
                            {inst?.exhausted
                              ? 'Exhausted'
                              : inst && t && cardInstanceInkCost(inst, t) !== null
                                ? `Ink ${cardInstanceInkCost(inst, t)}`
                                : null}
                          </div>
                        </div>
                        {desc ? <div className="inspectDeckRowDesc">{desc}</div> : null}
                        <div className="inspectDeckRowMeta">{inst ? `id: ${inst.id}` : ''}</div>
                      </div>
                    )
                  })}
                </>
              ) : (
                Object.values(state.player.deck.cardById).map((inst) => {
                  const t = Cards[inst.templateId]
                  const desc = t ? describeCardInstance(t, inst) : ''
                  return (
                    <div key={inst.id} className="inspectDeckRow">
                      <div className="inspectDeckRowHeader">
                        <div className="inspectDeckRowName">{t ? formatCardInstanceDisplayName(t, inst) : inst.templateId}</div>
                        <div className="inspectDeckRowInk">
                          {t && cardInstanceInkCost(inst, t) !== null ? `Ink ${cardInstanceInkCost(inst, t)}` : null}
                        </div>
                      </div>
                      {desc ? <div className="inspectDeckRowDesc">{desc}</div> : null}
                      <div className="inspectDeckRowMeta">id: {inst.id}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {inCombat && state.combat && (
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
                  <button type="button" className="handSelectionCancel" onClick={() => enqueue({ type: 'COMBAT/CANCEL_HAND_SELECTION' })}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="handSelectionSubmit"
                    disabled={!handSelectionCanSubmit}
                    onClick={() => {
                      if (!handSelectionCanSubmit) return
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
                    const descLines = inst && t ? combatHandDescriptionLinesForInstance(t, inst, state.player.power, state.player.firepowerMultiplier) : []
                    const chosen = handSelection.chosenIds.includes(cid)
                    const picksLeft = handSelectionMaxPicks - handSelectionChosenCount
                    const canInteract = chosen || picksLeft > 0
                    return (
                      <div
                        key={`pick-${idx}-${cid}`}
                        className={`card handSelectionCard ${chosen ? 'handSelectionCardChosen' : ''} ${!chosen && picksLeft <= 0 ? 'cardDisabled' : ''}`}
                        onClick={() => {
                          if (!canInteract) return
                          enqueue({ type: 'COMBAT/PICK_HAND_SELECTION_CARD', cardInstanceId: cid })
                        }}
                      >
                        <div className="cardHeader">
                          <div className="cardName">{inst && t ? formatCardInstanceDisplayName(t, inst) : inst?.templateId ?? cid}</div>
                          {inst && t && cardInstanceInkCost(inst, t) !== null ? (
                            <div className="cardInk" aria-label={`Ink cost ${cardInstanceInkCost(inst, t)}`}>
                              {inst.exhausted ? 'Exhausted' : `Ink ${cardInstanceInkCost(inst, t)}`}
                            </div>
                          ) : inst?.exhausted ? (
                            <div className="cardInk">Exhausted</div>
                          ) : null}
                        </div>
                        <CombatHandCardDesc lines={descLines} />
                        {t ? <div className="cardTags">{t.tags.join(' · ')}</div> : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="bunnyMeter">
            <div className="bunnyMeterLabel">Bunnies</div>
            <div className="bunnyMeterValue">{state.player.bunnies}</div>
            <button
              type="button"
              className="bunnyMeterEndTurn"
              disabled={state.phase !== 'COMBAT_PLAYER_READY'}
              onClick={() => enqueue({ type: 'COMBAT/END_TURN' })}
            >
              End Turn (release the bunnies)
            </button>
          </div>

          <div className="footerRow">
            <div className="pill">
              INK: {state.player.energy}/{combatEffectiveMaxEnergy(state)}
            </div>
          </div>

          {state.phase !== 'COMBAT_SELECT_HAND_CARD' ? (
          <div className="handRow">
            {state.player.deck.hand.map((cid, idx) => {
              const inst = state.player.deck.cardById[cid]
              const t = inst ? Cards[inst.templateId] : undefined
              const descLines = inst && t ? combatHandDescriptionLinesForInstance(t, inst, state.player.power, state.player.firepowerMultiplier) : []
              const canPlay = !!inst && !!t && cardInstanceIsPlayable(inst, t, state.player.energy)
              return (
                <div
                  key={`hand-${idx}-${cid}`}
                  className={`card ${canPlay ? '' : 'cardDisabled'}`}
                  onClick={() => {
                    if (!inst || !t) return
                    if (!canPlay) return
                    enqueue({ type: 'COMBAT/PLAY_CARD', cardInstanceId: cid })
                  }}
                >
                  <div className="cardHeader">
                    <div className="cardName">{inst && t ? formatCardInstanceDisplayName(t, inst) : inst?.templateId ?? cid}</div>
                    {inst && t && cardInstanceInkCost(inst, t) !== null ? (
                      <div className="cardInk" aria-label={`Ink cost ${cardInstanceInkCost(inst, t)}`}>
                        {inst.exhausted ? 'Exhausted' : `Ink ${cardInstanceInkCost(inst, t)}`}
                      </div>
                    ) : inst?.exhausted ? (
                      <div className="cardInk">Exhausted</div>
                    ) : null}
                  </div>
                  <CombatHandCardDesc lines={descLines} />
                  {t ? <div className="cardTags">{t.tags.join(' · ')}</div> : null}
                </div>
              )
            })}
          </div>
          ) : null}

          {state.combat.enemies.aliveIds.map((id) => {
            const e = state.combat!.enemies.enemyById[id]
            const tmpl = Enemies[e.templateId]
            const boonPrefix = (e.boons ?? [])
              .map((b) => EnemyBoons[b]?.name ?? '')
              .filter((s) => !!s)
              .join(' ')
            const intent = e.intent ? describeEnemyIntent(e.intent, e.strength) : '…'
            const selected = state.combat!.targeting.selectedEnemyId === id
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
      )}

      {state.phase === 'TITLE' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">LAPIN LAZULI</div>
            <button className="btn" onClick={() => enqueue({ type: 'TITLE/NEW_GAME' })}>
              New Game
            </button>
          </div>
        </div>
      )}

      {state.phase === 'RELIC_SELECT_STARTER' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">Starter Relics</div>
            {(state.relicSelection?.offered ?? []).map((id) => {
              const r = Relics[id]
              return (
                <button key={id} className="btn relicOfferBtn" onClick={() => enqueue({ type: 'RELIC/CHOOSE_STARTER', relicId: id })}>
                  <div className="relicThumb">{r?.thumb ?? '?'}</div>
                  <div className="relicOfferText">
                    <div>{r?.name ?? id}</div>
                      <div className="relicOfferDesc">{r ? describeRelic(r) : ''}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {state.phase === 'PATH_SELECT' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">Choose a Path</div>
            {(state.pathSelection?.offered ?? []).map((id, idx) => {
              const p = Paths[id]
              const cooldown = p?.cooldown ?? 0
              const locked = state.pathSelection?.slotLocked?.[idx] ?? false
              const keys = state.player.keys
              const blockedNoKey = locked && keys <= 0
              const combatPreview = state.pathSelection?.combatPreviews?.[idx] ?? null
              return (
                <button
                  key={`${id}-${idx}`}
                  type="button"
                  className={`btn relicOfferBtn ${blockedNoKey ? 'pathChoiceBlocked' : ''}`}
                  disabled={blockedNoKey}
                  onClick={() => {
                    if (blockedNoKey) return
                    if (locked && keys > 0) {
                      enqueue({ type: 'PATH/UNLOCK_SLOT', slotIndex: idx })
                      return
                    }
                    enqueue({ type: 'PATH/CHOOSE', pathId: id, slotIndex: idx })
                  }}
                >
                  <div className="relicThumb">{p?.name?.slice(0, 1).toUpperCase() ?? '?'}</div>
                  <div className="relicOfferText">
                    {locked ? <div className="pathLockedBadge">LOCKED</div> : null}
                    <div>{p?.name ?? id}</div>
                    {isCombatPath(id) && combatPreview ? (
                      <div className="relicOfferDesc pathCombatPreview">{pathCombatPreviewLabel(combatPreview)}</div>
                    ) : (
                      <div className="relicOfferDesc">
                        Frequency: {p?.frequency ?? 0} · Duplicates: {p?.duplicatesAllowed ? 'Yes' : 'No'} · Min level:{' '}
                        {p?.minimumLevel ?? 0}
                        {cooldown > 0 ? ` · Cooldown: ${cooldown} levels` : ''}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {state.phase === 'SHOP' && state.shop && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel shopPanel">
            <div className="titleScreenTitle">Shop</div>
            <div className="shopGoldLine">Gold: {state.player.gold}</div>
            <div className="shopGrid">
              {state.shop.items.map((item, slotIndex) => {
                const canBuy = !item.sold && state.player.gold >= item.price
                if (item.kind === 'RELIC') {
                  const r = Relics[item.relicId]
                  const title = r?.name ?? item.relicId
                  return (
                    <button
                      key={`shop-${slotIndex}`}
                      type="button"
                      className="shopItemBtn"
                      disabled={!canBuy}
                      onClick={() => {
                        if (!canBuy) return
                        enqueue({ type: 'SHOP/BUY_ITEM', slotIndex })
                      }}
                    >
                      <div className="relicThumb shopItemThumb">{r?.thumb ?? '?'}</div>
                      <div className="relicOfferText shopItemText">
                        <div className="shopItemTitleRow">
                          <span className="shopItemName">{item.sold ? `${title} (sold)` : title}</span>
                          <span className="shopItemPriceTag">{item.price}g</span>
                        </div>
                        {r ? <div className="relicOfferDesc shopItemDesc">{describeRelic(r)}</div> : null}
                      </div>
                    </button>
                  )
                }
                if (item.kind === 'KEY') {
                  const title = 'Key'
                  return (
                    <button
                      key={`shop-${slotIndex}`}
                      type="button"
                      className="shopItemBtn"
                      disabled={!canBuy}
                      onClick={() => {
                        if (!canBuy) return
                        enqueue({ type: 'SHOP/BUY_ITEM', slotIndex })
                      }}
                    >
                      <div className="relicThumb shopItemThumb">K</div>
                      <div className="relicOfferText shopItemText">
                        <div className="shopItemTitleRow">
                          <span className="shopItemName">{item.sold ? `${title} (sold)` : title}</span>
                          <span className="shopItemPriceTag">{item.price}g</span>
                        </div>
                        <div className="relicOfferDesc shopItemDesc">Adds 1 key to your inventory.</div>
                      </div>
                    </button>
                  )
                }
                const t = Cards[item.cardId]
                const desc = t ? describeOfferedCardWithUpgrades(t, item.upgrades) : ''
                const label = t ? formatCardName(t.name, item.upgrades) : item.cardId
                return (
                  <button
                    key={`shop-${slotIndex}`}
                    type="button"
                    className="shopItemBtn"
                    disabled={!canBuy}
                    onClick={() => {
                      if (!canBuy) return
                      enqueue({ type: 'SHOP/BUY_ITEM', slotIndex })
                    }}
                  >
                    <div className="relicThumb shopItemThumb">{label.slice(0, 1).toUpperCase()}</div>
                    <div className="relicOfferText shopItemText">
                      <div className="shopItemTitleRow">
                        <span className="shopItemName">{item.sold ? `${label} (sold)` : label}</span>
                        <span className="shopItemPriceTag">{item.price}g</span>
                      </div>
                      {desc ? <div className="relicOfferDesc shopItemDesc">{desc}</div> : null}
                    </div>
                  </button>
                )
              })}
            </div>
            <button type="button" className="btn" onClick={() => enqueue({ type: 'SHOP/LEAVE' })}>
              Leave Shop
            </button>
          </div>
        </div>
      )}

      {state.phase === 'REST' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">Rest</div>
            <div className="relicOfferDesc">
              You rested and healed {state.restOutcome?.healedHp ?? 0} HP.
            </div>
            <button type="button" className="btn" onClick={() => enqueue({ type: 'REST/CONTINUE' })}>
              Continue
            </button>
          </div>
        </div>
      )}

      {state.phase === 'GEMSTONE_CAVERN' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            {state.gemstoneCavern?.socketing ? (
              <>
                <div className="titleScreenTitle">
                  Socket ({Gems[state.gemstoneCavern.socketing.gemId]?.name ?? state.gemstoneCavern.socketing.gemId}) into a card
                </div>
                <button type="button" className="btn" onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/SKIP_SOCKETING' })}>
                  Skip
                </button>
                <div className="gemstoneSocketCardList">
                  {socketableDeckCards(state).map((inst) => {
                    const t = Cards[inst.templateId]
                    const selected = state.gemstoneCavern?.socketing?.selectedCardInstanceId === inst.id
                    return (
                      <button
                        key={inst.id}
                        type="button"
                        className={`btn relicOfferBtn gemstoneSocketCard ${selected ? 'handSelectionCardChosen' : ''}`}
                        onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/SELECT_SOCKET_CARD', cardInstanceId: inst.id })}
                      >
                        <div className="relicOfferText">
                          <div>{t ? formatCardInstanceDisplayName(t, inst) : inst.templateId}</div>
                          {t ? <div className="relicOfferDesc">{describeCardInstance(t, inst)}</div> : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {state.gemstoneCavern.socketing.selectedCardInstanceId ? (
                  <button type="button" className="btn" onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/CONFIRM_SOCKETING' })}>
                    Confirm socketing {Gems[state.gemstoneCavern.socketing.gemId]?.name ?? state.gemstoneCavern.socketing.gemId}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div className="titleScreenTitle">Gemstone Cavern</div>
                {(state.gemstoneCavern?.offered ?? []).map((gemId, idx) => {
                  const gem = Gems[gemId]
                  return (
                    <button
                      key={`${gemId}-${idx}`}
                      type="button"
                      className="btn relicOfferBtn"
                      onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/PICK_GEM', gemId })}
                    >
                      <div className="relicOfferText">
                        <div>{gem?.name ?? gemId}</div>
                        {gem ? <div className="relicOfferDesc">{gem.effects.map((fx) => `${describeEffect(fx)}.`).join(' ')}</div> : null}
                      </div>
                    </button>
                  )
                })}
                <button type="button" className="btn" onClick={() => enqueue({ type: 'GEMSTONE_CAVERN/PROCEED' })}>
                  Proceed
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {state.phase === 'TREASURE_ROOM' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">Treasure Room</div>
            {!state.treasureRoom?.selectionComplete ? (
              (state.treasureRoom?.offered ?? []).map((id, idx) => {
                const r = Relics[id]
                return (
                  <button
                    key={`${id}-${idx}`}
                    type="button"
                    className="btn relicOfferBtn"
                    onClick={() => enqueue({ type: 'TREASURE_ROOM/PICK_RELIC', relicId: id })}
                  >
                    <div className="relicThumb">{r?.thumb ?? '?'}</div>
                    <div className="relicOfferText">
                      <div>{r?.name ?? id}</div>
                      <div className="relicOfferDesc">{r ? describeRelic(r) : ''}</div>
                    </div>
                  </button>
                )
              })
            ) : (
              <button type="button" className="btn" onClick={() => enqueue({ type: 'TREASURE_ROOM/PROCEED' })}>
                Proceed
              </button>
            )}
          </div>
        </div>
      )}

      {state.phase === 'REWARD' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">
              {rewardGold > 0 || rewardKeys > 0 ? (
                <>
                  Victory! Earned {rewardLootEarned}.
                  {rewardKind === 'RELIC' ? ' Choose a relic to proceed.' : ' Choose a card to proceed.'}
                </>
              ) : rewardKind === 'RELIC' ? (
                <>Choose a relic to proceed.</>
              ) : (
                <>Choose a card to proceed.</>
              )}
            </div>
            {rewardKind === 'CARD'
              ? (state.cardReward?.kind === 'CARD' ? state.cardReward.offered : []).map((o, idx) => {
                  const t = Cards[o.cardId]
                  const desc = t ? describeOfferedCardWithUpgrades(t, o.upgrades) : ''
                  const label = t ? formatCardName(t.name, o.upgrades) : o.cardId
                  return (
                    <button
                      key={`${o.cardId}-${idx}`}
                      className="btn relicOfferBtn"
                      onClick={() => {
                        enqueue({ type: 'REWARD/PICK_CARD', cardId: o.cardId })
                      }}
                    >
                      <div className="relicThumb">{label.slice(0, 1).toUpperCase()}</div>
                      <div className="relicOfferText">
                        <div>{label}</div>
                        <div className="relicOfferDesc">{desc}</div>
                      </div>
                    </button>
                  )
                })
              : rewardKind === 'RELIC' && state.cardReward?.kind === 'RELIC'
                ? state.cardReward.offered.map((id, idx) => {
                    const r = Relics[id]
                    return (
                      <button
                        key={`${id}-${idx}`}
                        type="button"
                        className="btn relicOfferBtn"
                        onClick={() => enqueue({ type: 'REWARD/PICK_RELIC', relicId: id })}
                      >
                        <div className="relicThumb">{r?.thumb ?? '?'}</div>
                        <div className="relicOfferText">
                          <div>{r?.name ?? id}</div>
                          <div className="relicOfferDesc">{r ? describeRelic(r) : ''}</div>
                        </div>
                      </button>
                    )
                  })
                : null}
          </div>
        </div>
      )}

      {state.phase === 'GAME_WIN' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">Victory</div>
            <div className="relicOfferDesc">
              You defeated Miso Tyrant and completed your journey. Congratulations!
            </div>
            <button className="btn" onClick={() => enqueue({ type: 'TITLE/MAIN_MENU' })}>
              Main menu
            </button>
          </div>
        </div>
      )}

      {state.phase === 'DEFEAT' && (
        <div className="mapCenter titleScreen">
          <div className="titleScreenPanel">
            <div className="titleScreenTitle">Defeat</div>
            <div className="relicOfferDesc">
              An {state.defeat?.enemyName ?? 'enemy'} gobbled you up at level {state.defeat?.level ?? state.level}.
            </div>
            <button className="btn" onClick={() => enqueue({ type: 'TITLE/MAIN_MENU' })}>
              Main menu
            </button>
          </div>
        </div>
      )}

    </>
  )
}
