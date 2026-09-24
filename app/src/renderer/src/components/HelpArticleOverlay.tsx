import { useEffect } from 'react'
import { X } from 'lucide-react'
import Markdown from 'react-markdown'
import type { HelpArticle } from '../help/articles'

type HelpArticleOverlayProps = {
  article: HelpArticle
  onClose: () => void
}

function HelpArticleOverlay({ article, onClose }: HelpArticleOverlayProps): React.JSX.Element {
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
    <div className="help-overlay">
      <button type="button" className="help-overlay-close" aria-label="Закрыть" onClick={onClose}>
        <X size={32} aria-hidden="true" />
      </button>
      <h2 className="help-overlay-title">{article.title}</h2>
      <div className="help-markdown">
        <Markdown>{article.body}</Markdown>
      </div>
    </div>
  )
}

export default HelpArticleOverlay
