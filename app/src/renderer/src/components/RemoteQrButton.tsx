import { useEffect, useRef, useState } from 'react'
import { Check, Copy, QrCode } from 'lucide-react'
import type { ServerInfo } from '../../../shared/remote'
import Dialog from './Dialog'

function RemoteQrButton(): React.JSX.Element {
  const [info, setInfo] = useState<ServerInfo | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let active = true
    window.api?.remote?.getServerInfo().then((value) => {
      if (active) {
        setInfo(value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(
    () => () => {
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current)
      }
    },
    []
  )

  function close(): void {
    setOpen(false)
    setCopied(false)
  }

  async function copyUrl(): Promise<void> {
    if (!info) {
      return
    }
    try {
      await navigator.clipboard.writeText(info.url)
    } catch {
      return
    }
    setCopied(true)
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current)
    }
    resetTimer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <button
        type="button"
        className="remote-qr-button"
        aria-label="Показать QR-код для телефона"
        disabled={!info}
        onClick={() => setOpen(true)}
      >
        <QrCode size={22} aria-hidden="true" />
      </button>
      {open && info && (
        <Dialog titleId="remote-qr-title" className="remote-qr-dialog" onClose={close}>
          <h2 id="remote-qr-title" className="comment-dialog-title">
            Управление с телефона
          </h2>
          <img
            className="remote-qr-image"
            src={info.qrDataUrl}
            alt={`QR-код для адреса ${info.url}`}
          />
          <div className="remote-qr-link">
            <p className="remote-qr-url">{info.url}</p>
            <button
              type="button"
              className="remote-qr-copy"
              aria-label="Скопировать ссылку"
              onClick={copyUrl}
            >
              {copied ? (
                <Check size={20} aria-hidden="true" />
              ) : (
                <Copy size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}

export default RemoteQrButton
