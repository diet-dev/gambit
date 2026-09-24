import { useEffect, useState } from 'react'
import { QrCode } from 'lucide-react'
import type { ServerInfo } from '../../../shared/remote'
import Dialog from './Dialog'

function RemoteQrButton(): React.JSX.Element {
  const [info, setInfo] = useState<ServerInfo | null>(null)
  const [open, setOpen] = useState(false)

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
        <Dialog
          titleId="remote-qr-title"
          className="remote-qr-dialog"
          onClose={() => setOpen(false)}
        >
          <h2 id="remote-qr-title" className="comment-dialog-title">
            Управление с телефона
          </h2>
          <img
            className="remote-qr-image"
            src={info.qrDataUrl}
            alt={`QR-код для адреса ${info.url}`}
          />
          <p className="remote-qr-url">{info.url}</p>
        </Dialog>
      )}
    </>
  )
}

export default RemoteQrButton
