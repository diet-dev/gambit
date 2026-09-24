import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

type DialogProps = {
  titleId: string
  onClose: () => void
  className?: string
  children: React.ReactNode
}

function Dialog({ titleId, onClose, className, children }: DialogProps): React.JSX.Element {
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
        className={className ? `comment-dialog ${className}` : 'comment-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
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
        {children}
      </div>
    </div>
  )
}

export default Dialog
