export type UciTransport = {
  post(message: string): void
  onMessage(handler: (line: string) => void): void
  terminate(): void
}
