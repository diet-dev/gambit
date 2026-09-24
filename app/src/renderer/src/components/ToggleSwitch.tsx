type ToggleSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      className={checked ? 'toggle-switch toggle-switch-on' : 'toggle-switch'}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-switch-thumb" aria-hidden="true" />
    </button>
  )
}

export default ToggleSwitch
