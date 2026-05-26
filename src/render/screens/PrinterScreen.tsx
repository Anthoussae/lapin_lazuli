import { useEffect, useState } from 'react'
import { printerBackdrop } from '../assets/backdropImages'
import { printerSprite, speechBubbleRightSprite } from '../assets/displayImages'
import { PrinterDuplicateDialog } from '../primitives/PrinterDuplicateDialog'
import { PrinterFoilDialog } from '../primitives/PrinterFoilDialog'
import type { ScreenProps } from './types'

const PRINTER_DIALOGUE_INTRO = 'Shall I foil a card, or print off a fresh duplicate?'
const PRINTER_DIALOGUE_AFTER_CHOICE = 'Good luck!'

export function PrinterScreen(props: ScreenProps) {
  const { state, enqueue } = props
  const printer = state.mysteryRoom?.printer
  const cardFoiled = printer?.cardFoiled === true
  const cardDuplicated = printer?.cardDuplicated === true
  const choiceComplete = cardFoiled || cardDuplicated
  const [foilDialogOpen, setFoilDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)

  useEffect(() => {
    if (choiceComplete) {
      setFoilDialogOpen(false)
      setDuplicateDialogOpen(false)
    }
  }, [choiceComplete])

  return (
    <>
      <div className="screenBackdrop screenBackdrop--printer" aria-hidden>
        <img className="screenBackdrop__img" src={printerBackdrop} alt="" draggable={false} />
      </div>
      <img className="printerArt" src={printerSprite} alt="" draggable={false} />
      <img className="printerSpeechBubble" src={speechBubbleRightSprite} alt="" draggable={false} />
      <p className="printerDialogue">
        {choiceComplete ? PRINTER_DIALOGUE_AFTER_CHOICE : PRINTER_DIALOGUE_INTRO}
      </p>
      <h1 className="printerTitle">The Printer</h1>
      <button
        type="button"
        className="btn printerFoilBtn"
        disabled={choiceComplete}
        onClick={() => setFoilDialogOpen(true)}
      >
        Foil a card!
      </button>
      <button
        type="button"
        className="btn printerProceedBtn"
        disabled={!choiceComplete}
        onClick={() => enqueue({ type: 'EVENT/PROCEED' })}
      >
        Proceed
      </button>
      <button
        type="button"
        className="btn printerDuplicateBtn"
        disabled={choiceComplete}
        onClick={() => setDuplicateDialogOpen(true)}
      >
        Duplicate
      </button>
      {foilDialogOpen && !choiceComplete ? (
        <PrinterFoilDialog
          state={state}
          enqueue={enqueue}
          onClose={() => setFoilDialogOpen(false)}
        />
      ) : null}
      {duplicateDialogOpen && !choiceComplete ? (
        <PrinterDuplicateDialog
          state={state}
          enqueue={enqueue}
          onClose={() => setDuplicateDialogOpen(false)}
        />
      ) : null}
    </>
  )
}
