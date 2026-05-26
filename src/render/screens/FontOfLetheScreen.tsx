import { useEffect, useState } from 'react'
import { forestBackdrop } from '../assets/backdropImages'
import { fontOfLetheEmpty, fontOfLetheFull } from '../assets/displayImages'
import { FontOfLetheForgetDialog } from '../primitives/FontOfLetheForgetDialog'
import { OpaqueImageButton } from '../primitives/OpaqueImageButton'
import type { ScreenProps } from './types'

export function FontOfLetheScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const cardForgotten = state.mysteryRoom?.fontOfLethe?.cardForgotten === true
  const fountainArt = cardForgotten ? fontOfLetheEmpty : fontOfLetheFull
  const [forgetDialogOpen, setForgetDialogOpen] = useState(false)

  useEffect(() => {
    if (cardForgotten) setForgetDialogOpen(false)
  }, [cardForgotten])

  return (
    <>
      <div className="screenBackdrop screenBackdrop--fontOfLethe" aria-hidden>
        <img className="screenBackdrop__img" src={forestBackdrop} alt="" draggable={false} />
      </div>
      {cardForgotten ? (
        <div className="fontOfLetheArtBtn fontOfLetheArtBtn--inactive" aria-hidden>
          <img
            className="fontOfLetheArtBtn__img fontOfLetheArtBtn__img--empty"
            src={fountainArt}
            alt=""
            draggable={false}
          />
        </div>
      ) : (
        <OpaqueImageButton
          className="fontOfLetheArtBtn"
          imageClassName="fontOfLetheArtBtn__img"
          src={fountainArt}
          alt="Open forget card dialog"
          onClick={() => setForgetDialogOpen(true)}
        />
      )}
      <h1 className="fontOfLetheTitle">Font of Lethe</h1>
      <p className="fontOfLetheSubtitle">Forget a card forever.</p>
      <button
        type="button"
        className="btn fontOfLetheProceedBtn"
        disabled={!cardForgotten}
        onClick={() => enqueue({ type: 'EVENT/PROCEED' })}
      >
        Proceed
      </button>
      {forgetDialogOpen && !cardForgotten ? (
        <FontOfLetheForgetDialog state={state} enqueue={enqueue} />
      ) : null}
    </>
  )
}
