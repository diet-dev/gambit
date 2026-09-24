import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { type Situation } from '../situations'

type SituationCommentDialogProps = {
  situation: Situation
  onClose: () => void
}

function SituationCommentDialog({
  situation,
  onClose
}: SituationCommentDialogProps): React.JSX.Element {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    return () => previouslyFocused?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="dialog-overlay">
      <div
        className="comment-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-dialog-title"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="comment-dialog-close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={32} aria-hidden="true" />
        </button>
        <h2 id="comment-dialog-title" className="comment-dialog-title">
          {situation.title}
        </h2>
        <p className="comment-dialog-text">{situation.comment}</p>
      </div>
    </div>
  )
}

export default SituationCommentDialog
