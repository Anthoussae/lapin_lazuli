import { readRootPxVar } from './relicTooltipPosition'

export function gameTooltipStackGapPx(): number {
  return readRootPxVar('--game-tooltip-stack-gap')
}

export function gameTooltipEdgePaddingPx(): number {
  return readRootPxVar('--game-tooltip-edge-padding')
}

export function gameTooltipAnchorOffsetX(): number {
  return readRootPxVar('--game-tooltip-anchor-offset-x')
}

export function enemyBoonTooltipViewportOffsetX(): number {
  return readRootPxVar('--game-tooltip-enemy-boon-offset-x')
}
