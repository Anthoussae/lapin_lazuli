import type { GameState } from '../core/types/state'
import type { GameAction } from '../reducers/actions'
import type { GameEvent } from '../reducers/events'
import { Cards } from '../data/cards'
import { Enemies } from '../data/enemies'
import { Paths } from '../data/paths'
import { Relics } from '../data/relics'
import type { CardId, CardInstanceId, PathId, RelicId } from '../core/types/ids'

declare global {
  interface StorageManager {
    // OPFS / Origin Private File System (Chromium).
    getDirectory: () => Promise<FileSystemDirectoryHandle>
  }
}

type LogEntry = Readonly<{
  t: number
  msg: string
  data?: Record<string, unknown>
}>

type GameLogFile = Readonly<{
  v: 1
  createdAt: number
  seed?: number
  entries: ReadonlyArray<LogEntry>
}>

function hasOpfs(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.storage?.getDirectory === 'function'
}

async function getLogsDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory()
  return await root.getDirectoryHandle('logs', { create: true })
}

async function readJsonFile<T>(dir: FileSystemDirectoryHandle, filename: string): Promise<T | null> {
  try {
    const fh = await dir.getFileHandle(filename)
    const f = await fh.getFile()
    const txt = await f.text()
    return JSON.parse(txt) as T
  } catch {
    return null
  }
}

async function writeJsonFile(dir: FileSystemDirectoryHandle, filename: string, value: unknown): Promise<void> {
  const fh = await dir.getFileHandle(filename, { create: true })
  const w = await fh.createWritable()
  await w.write(JSON.stringify(value, null, 2))
  await w.close()
}

async function deleteFileIfExists(dir: FileSystemDirectoryHandle, filename: string): Promise<void> {
  try {
    await dir.removeEntry(filename)
  } catch {
    // ignore
  }
}

function safeName(s: string | undefined | null): string {
  return s && s.trim().length ? s : 'Unknown'
}

function cardNameFromInstanceId(state: GameState, cardInstanceId: CardInstanceId): string {
  const inst = state.player.deck.cardById[cardInstanceId]
  const templateId = inst?.templateId
  return safeName(templateId ? Cards[templateId]?.name : null)
}

function enemyNameFromCombat(state: GameState): string | null {
  const c = state.combat
  if (!c) return null
  const firstAlive = c.enemies.aliveIds[0]
  const enemy = firstAlive ? c.enemies.enemyById[firstAlive] : null
  return enemy ? safeName(Enemies[enemy.templateId]?.name) : null
}

function pathName(pathId: PathId): string {
  return safeName(Paths[pathId]?.name ?? pathId)
}

function relicName(relicId: RelicId): string {
  return safeName(Relics[relicId]?.name ?? relicId)
}

function fmt(n: number): string {
  return Number.isFinite(n) ? String(n) : '0'
}

class GameLogger {
  private enabled = hasOpfs()
  private ready: Promise<void> | null = null
  private log: GameLogFile | null = null
  private flushTimer: number | null = null
  private flushing: Promise<void> | null = null

  private ensureReady(): Promise<void> {
    if (!this.enabled) return Promise.resolve()
    if (this.ready) return this.ready
    this.ready = (async () => {
      const dir = await getLogsDir()
      const current = await readJsonFile<GameLogFile>(dir, 'current.json')
      this.log = current ?? { v: 1, createdAt: Date.now(), entries: [] }
    })()
    return this.ready
  }

  async startNewLog(seed?: number): Promise<void> {
    if (!this.enabled) return
    await this.ensureReady()
    const dir = await getLogsDir()

    // Rotation:
    // - If current exists, copy it to previous (overwriting), deleting any old previous first.
    // - Always write a fresh current.
    const current = await readJsonFile<GameLogFile>(dir, 'current.json')
    if (current) {
      await deleteFileIfExists(dir, 'previous.json')
      await writeJsonFile(dir, 'previous.json', current)
    }

    const fresh: GameLogFile = { v: 1, createdAt: Date.now(), seed, entries: [] }
    this.log = fresh
    await writeJsonFile(dir, 'current.json', fresh)
  }

  append(msg: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return
    void this.ensureReady().then(() => {
      if (!this.log) this.log = { v: 1, createdAt: Date.now(), entries: [] }
      const next: LogEntry = { t: Date.now(), msg, ...(data ? { data } : {}) }
      this.log = { ...this.log, entries: [...this.log.entries, next] }
      this.scheduleFlush()
    })
  }

  private scheduleFlush(): void {
    if (!this.enabled) return
    if (this.flushTimer != null) return
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null
      void this.flush()
    }, 250)
  }

  private async flush(): Promise<void> {
    if (!this.enabled) return
    if (this.flushing) return this.flushing
    this.flushing = (async () => {
      await this.ensureReady()
      if (!this.log) return
      const dir = await getLogsDir()
      await writeJsonFile(dir, 'current.json', this.log)
    })().finally(() => {
      this.flushing = null
    })
    return this.flushing
  }

  capture(stateBefore: GameState, action: GameAction, stateAfter: GameState, events: ReadonlyArray<GameEvent>): void {
    if (!this.enabled) return

    // Action-driven lines (player intent).
    switch (action.type) {
      case 'TITLE/NEW_GAME':
        void this.startNewLog(stateAfter.seed)
        this.append(`New game started (seed ${fmt(stateAfter.seed)})`)
        break
      case 'RELIC/CHOOSE_STARTER':
        this.append(`Player selects ${relicName(action.relicId)} relic`)
        break
      case 'PATH/CHOOSE':
        this.append(`Player selects ${pathName(action.pathId)} path`)
        break
      case 'PATH/UNLOCK_SLOT':
        this.append(`Player unlocks path slot ${fmt(action.slotIndex)}`)
        break
      case 'COMBAT/PLAY_CARD':
        this.append(`Player casts ${cardNameFromInstanceId(stateBefore, action.cardInstanceId)} spell`)
        break
      case 'COMBAT/END_TURN':
        this.append('Player ends turn')
        break
      case 'SHOP/BUY_ITEM':
        this.append(`Player buys shop item in slot ${fmt(action.slotIndex)}`)
        break
      case 'SHOP/LEAVE':
        this.append('Player leaves shop')
        break
      case 'REST/SLEEP':
        this.append('Player sleeps at rest site')
        break
      case 'REST/STUDY':
        this.append('Player studies at rest site')
        break
      case 'TREASURE_ROOM/PICK_RELIC':
        this.append(`Player selects ${relicName(action.relicId)} relic`)
        break
      case 'REWARD/PICK_RELIC':
        this.append(`Player selects ${relicName(action.relicId)} relic`)
        break
      case 'REWARD/PICK_CARD':
        this.append(`Player takes ${safeName(Cards[action.cardId as CardId]?.name)} card`)
        break
      case 'REWARD/PICK_GOLD': {
        const earned = stateBefore.cardReward?.goldEarned ?? 0
        this.append(`Player collects ${fmt(earned)} gold`)
        break
      }
      case 'REWARD/PICK_KEYS': {
        const earned = stateBefore.cardReward?.keysEarned ?? 0
        this.append(`Player collects ${fmt(earned)} keys`)
        break
      }
    }

    // Derived milestones (state transitions).
    if (!stateBefore.combat && stateAfter.combat) {
      const enemy = enemyNameFromCombat(stateAfter)
      this.append(`Player enters combat (Lv ${fmt(stateAfter.level)}) vs ${safeName(enemy)}`)
    }

    // Event-driven lines (damage, combat end, etc.).
    for (const e of events) {
      switch (e.type) {
        case 'EVT/BUNNIES_RELEASING':
          this.append(`Player releases ${fmt(e.count)} bunnies`)
          break
        case 'EVT/PLAYER_HIT':
          this.append(`Player takes ${fmt(e.amount)} damage`)
          break
        case 'EVT/PLAYER_UNBLOCKED_DAMAGE':
          this.append(`Player takes ${fmt(e.amount)} unblocked damage (${e.source})`)
          break
        case 'EVT/PLAYER_DODGED':
          this.append('Player dodges')
          break
        case 'EVT/CRITICAL_HIT':
          this.append(`Critical hit (${e.variant}) x${fmt(e.multiplierPercent)}%`)
          break
        case 'EVT/COMBAT_ENDED':
          this.append(`Combat ends (${e.result})`)
          break
        case 'EVT/TURN_ENDED':
          this.append(`Turn ends (${e.by})`)
          break
      }
    }
  }
}

export const gameLog = new GameLogger()

