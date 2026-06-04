/**
 * FX listeners consume `ui.debug.lastEvents` per action batch (`eventBatchId`), not by comparing
 * joined line text (identical tails or poison lines caused missed batches).
 */
export type ConsumeDebugEventBatchOptions = Readonly<{
  /** When false, every line in the batch is delivered (e.g. multi-stack poison ticks). Default true. */
  dedupeLines?: boolean
}>

export function consumeDebugEventBatch(
  batchId: number,
  lastEvents: ReadonlyArray<string>,
  lastBatchIdRef: { current: number },
  onLine: (line: string) => void,
  options: ConsumeDebugEventBatchOptions = {},
): void {
  if (batchId === lastBatchIdRef.current) return
  lastBatchIdRef.current = batchId

  if (!lastEvents.length) return

  if (options.dedupeLines === false) {
    for (const line of lastEvents) onLine(line)
    return
  }

  const seenInBatch = new Set<string>()
  for (const line of lastEvents) {
    if (seenInBatch.has(line)) continue
    seenInBatch.add(line)
    onLine(line)
  }
}

/** @deprecated Use {@link consumeDebugEventBatch} with `eventBatchId`. */
export function forEachUniqueLineInDebugEventBatch(
  lastEvents: ReadonlyArray<string>,
  eventsKey: string,
  lastEventsKeyRef: { current: string },
  onLine: (line: string) => void,
): void {
  if (eventsKey === lastEventsKeyRef.current) return
  lastEventsKeyRef.current = eventsKey
  if (!lastEvents.length) return

  const seenInBatch = new Set<string>()
  for (const line of lastEvents) {
    if (seenInBatch.has(line)) continue
    seenInBatch.add(line)
    onLine(line)
  }
}
