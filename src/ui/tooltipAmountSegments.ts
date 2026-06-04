import type { CardDescSegment } from './describe'

/** Split tooltip copy around $amount / $damageamount when display differs from base (e.g. green hat poison). */
export function tooltipAmountSegments(
  raw: string,
  baseAmount: number,
  displayAmount: number,
): ReadonlyArray<CardDescSegment> | null {
  if (displayAmount === baseAmount) return null
  const token = raw.includes('$amount')
    ? '$amount'
    : raw.includes('$damageamount')
      ? '$damageamount'
      : null
  if (!token) return null
  const idx = raw.indexOf(token)
  if (idx < 0) return null
  return [
    { kind: 'text', text: raw.slice(0, idx) },
    { kind: 'amount', base: baseAmount, display: displayAmount },
    { kind: 'text', text: raw.slice(idx + token.length) },
  ]
}
