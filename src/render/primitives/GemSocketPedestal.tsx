import type { GemId } from '../../core/types/ids'
import { Gems, type GemTemplate } from '../../data/gems'
import { describeGemEffect } from '../../ui/describe'
import { blackCarpet2 } from '../assets/displayImages'
import { gemImageMap } from '../assets/gemImages'
import { GemIcon } from './GemIcon'

export function GemSocketPedestal(props: Readonly<{ gemId: GemId; gem?: GemTemplate }>) {
  const { gemId, gem = Gems[gemId] } = props
  const gemName = gem?.name ?? gemId

  return (
    <div className="gemstoneSocketPedestal">
      <img className="gemstoneSocketPedestal__carpet" src={blackCarpet2} alt="" draggable={false} />
      <GemIcon
        imageSrc={gemImageMap[gemId]}
        fallback={gemName.slice(0, 1)}
        alt={gemName}
        tooltipName={gemName}
        tooltipEffect={gem ? describeGemEffect(gem) : ''}
      />
    </div>
  )
}
