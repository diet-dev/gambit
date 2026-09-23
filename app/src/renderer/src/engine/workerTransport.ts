import { type UciTransport } from './uciTransport'

export function createWorkerTransport(url: string): UciTransport {
  const worker = new Worker(url)

  return {
    post: (message) => worker.postMessage(message),
    onMessage: (handler) => {
      worker.onmessage = (event) => handler(String(event.data))
    },
    terminate: () => worker.terminate()
  }
}
