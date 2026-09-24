import { Moon, Sun, type LucideIcon } from 'lucide-react'
import type { Theme } from '../theme'

type ThemeToggleProps = {
  theme: Theme
  onChange: (theme: Theme) => void
}

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'light', label: 'Светлая', icon: Sun }
]

function ThemeToggle({ theme, onChange }: ThemeToggleProps): React.JSX.Element {
  return (
    <div
      className="theme-toggle"
      role="radiogroup"
      aria-label="Тема оформления"
      data-active={theme}
    >
      <span className="theme-toggle-thumb" aria-hidden="true" />
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = option.value === theme
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={
              active ? 'theme-toggle-option theme-toggle-option-active' : 'theme-toggle-option'
            }
            onClick={() => onChange(option.value)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ThemeToggle
