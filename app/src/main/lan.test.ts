import type { NetworkInterfaceInfo } from 'os'
import { describe, expect, it } from 'vitest'
import { getLanAddress } from './lan'

function ipv4(address: string, internal: boolean): NetworkInterfaceInfo {
  return {
    address,
    netmask: '255.255.255.0',
    family: 'IPv4',
    mac: '00:00:00:00:00:00',
    internal,
    cidr: `${address}/24`
  }
}

describe('getLanAddress', () => {
  it('returns the first non-internal IPv4 address', () => {
    const result = getLanAddress({
      lo: [ipv4('127.0.0.1', true)],
      eth0: [ipv4('192.168.1.42', false)]
    })

    expect(result).toBe('192.168.1.42')
  })

  it('falls back to localhost', () => {
    const result = getLanAddress({ lo: [ipv4('127.0.0.1', true)] })

    expect(result).toBe('localhost')
  })
})
