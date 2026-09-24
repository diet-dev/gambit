import { helpArticles } from '../help/articles'

type HelpPanelProps = {
  openArticleId: string | null
  onOpen: (id: string) => void
}

function HelpPanel({ openArticleId, onOpen }: HelpPanelProps): React.JSX.Element {
  return (
    <div className="help-panel">
      <ul className="help-list">
        {helpArticles.map((article) => (
          <li key={article.id}>
            <button
              type="button"
              className={
                article.id === openArticleId ? 'help-article help-article-active' : 'help-article'
              }
              aria-current={article.id === openArticleId}
              onClick={() => onOpen(article.id)}
            >
              {article.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default HelpPanel
