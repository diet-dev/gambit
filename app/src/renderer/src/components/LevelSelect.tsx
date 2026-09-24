import { useEffect, useRef, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { ENGINE_LEVELS, clampLevel } from '../engine/levels'

type LevelSelectProps = {
  level: number
  onChange: (level: number) => void
}

function LevelSelect({ level, onChange }: LevelSelectProps): React.JSX.Element {
  const current = clampLevel(level)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) {
      optionRefs.current[current]?.focus()
    }
  }, [open, current])

  function select(index: number): void {
    onChange(clampLevel(index))
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onListKeyDown(event: React.KeyboardEvent<HTMLUListElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
      return
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()
    const options = optionRefs.current.filter(
      (element): element is HTMLButtonElement => element !== null
    )
    const activeIndex = options.indexOf(document.activeElement as HTMLButtonElement)
    const nextIndex =
      event.key === 'ArrowDown'
        ? Math.min(activeIndex + 1, options.length - 1)
        : Math.max(activeIndex - 1, 0)
    options[nextIndex]?.focus()
  }

  return (
    <div className="level-select" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="level-select-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Сила соперника: ${ENGINE_LEVELS[current].name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="level-select-value">{ENGINE_LEVELS[current].name}</span>
        <ChevronUp className="level-select-chevron" size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul
          className="level-select-menu"
          role="listbox"
          aria-label="Сила соперника"
          onKeyDown={onListKeyDown}
        >
          {ENGINE_LEVELS.map((option, index) => (
            <li key={option.name}>
              <button
                ref={(element) => {
                  optionRefs.current[index] = element
                }}
                type="button"
                role="option"
                aria-selected={index === current}
                className={
                  index === current
                    ? 'level-select-option level-select-option-active'
                    : 'level-select-option'
                }
                onClick={() => select(index)}
              >
                <span>{option.name}</span>
                <span className="level-select-elo">ELO {option.elo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LevelSelect
