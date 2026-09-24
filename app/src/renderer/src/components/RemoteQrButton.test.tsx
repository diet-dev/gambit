import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import RemoteQrButton from './RemoteQrButton'
import type { RemoteApi, ServerInfo } from '../../../shared/remote'

const info: ServerInfo = {
  url: 'http://192.168.1.42:3210/',
  port: 3210,
  qrDataUrl: 'data:image/png;base64,AAAA'
}

function installApi(serverInfo: ServerInfo | null): RemoteApi {
  const remote: RemoteApi = {
    publishPosition: vi.fn(),
    onRemoteMove: vi.fn(() => () => {}),
    getServerInfo: vi.fn(async () => serverInfo)
  }
  window.api = { remote }
  return remote
}

describe('RemoteQrButton', () => {
  it('is disabled until the address is available', async () => {
    installApi(null)
    const { getByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeDisabled())
  })

  it('opens a dialog with the QR code and address', async () => {
    installApi(info)
    const { getByRole, findByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))

    const dialog = await findByRole('dialog')
    expect(dialog).toHaveTextContent('http://192.168.1.42:3210/')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(info.qrDataUrl)
  })

  it('closes on Escape', async () => {
    installApi(info)
    const { getByRole, findByRole, queryByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))
    await findByRole('dialog')

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('copies the address to the clipboard', async () => {
    installApi(info)
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })
    const { getByRole, findByRole } = render(<RemoteQrButton />)

    await waitFor(() => expect(getByRole('button', { name: /QR-код/ })).toBeEnabled())
    fireEvent.click(getByRole('button', { name: /QR-код/ }))
    await findByRole('dialog')

    fireEvent.click(getByRole('button', { name: 'Скопировать ссылку' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(info.url))
  })
})
