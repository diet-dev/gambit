import type { NetworkInterfaceInfo } from 'os'

export function getLanAddress(interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>): string {
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address
      }
    }
  }
  return 'localhost'
}
