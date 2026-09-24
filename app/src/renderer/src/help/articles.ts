const modules = import.meta.glob('./*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>

export type HelpArticle = {
  id: string
  title: string
  body: string
}

function articleTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

export const helpArticles: HelpArticle[] = Object.entries(modules)
  .map(([path, content]) => {
    const id = path.split('/').pop()!.replace(/\.md$/, '')
    return {
      id,
      title: articleTitle(content, id),
      body: content.replace(/^#\s+.+\n+/, '')
    }
  })
  .sort((a, b) => a.title.localeCompare(b.title, 'ru'))

export function findHelpArticle(id: string | null): HelpArticle | undefined {
  return id ? helpArticles.find((article) => article.id === id) : undefined
}
