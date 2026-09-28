export type DatabaseApi = {
  exportSnapshot: () => Promise<string | null>
}
