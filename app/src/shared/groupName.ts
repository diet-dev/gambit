const GROUP_NAME_PATTERN = /^[А-ЯЁ0-9]+(?:-[А-ЯЁ0-9]+)*$/

export function normalizeGroupNameInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^А-ЯЁ0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
}

export function finalizeGroupName(value: string): string {
  return value.replace(/-+$/, '')
}

export function isValidGroupName(value: string): boolean {
  return GROUP_NAME_PATTERN.test(value)
}
