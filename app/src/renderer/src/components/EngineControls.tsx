import { Bot } from 'lucide-react'
import LevelSelect from './LevelSelect'
import ToggleSwitch from './ToggleSwitch'

type EngineControlsProps = {
  enabled: boolean
  level: number
  onToggle: (enabled: boolean) => void
  onLevelChange: (level: number) => void
}

function EngineControls({
  enabled,
  level,
  onToggle,
  onLevelChange
}: EngineControlsProps): React.JSX.Element {
  return (
    <div className={enabled ? 'engine-controls engine-controls-on' : 'engine-controls'}>
      <Bot className="engine-controls-icon" size={18} aria-hidden="true" />
      <ToggleSwitch checked={enabled} onChange={onToggle} label="Играть с ботом" />
      <LevelSelect level={level} onChange={onLevelChange} />
    </div>
  )
}

export default EngineControls
