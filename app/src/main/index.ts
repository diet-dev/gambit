import { app, shell, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { networkInterfaces } from 'os'
import QRCode from 'qrcode'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createRemoteServer, type RemoteServer } from './remoteServer'
import { getLanAddress } from './lan'
import { registerRemoteIpc } from './remoteIpc'

let remoteServer: RemoteServer | null = null

async function startRemoteServer(): Promise<void> {
  remoteServer = await createRemoteServer({
    staticDir: join(__dirname, '../renderer'),
    devServerUrl: is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined,
    onMove: (move) => {
      BrowserWindow.getAllWindows()[0]?.webContents.send('remote:move', move)
    }
  })

  const token = Date.now().toString(36)
  const url = `http://${getLanAddress(networkInterfaces())}:${remoteServer.port}/?v=${token}`
  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(url)
  } catch (error) {
    console.error('Не удалось сгенерировать QR-код:', error)
  }
  registerRemoteIpc({
    ipcMain,
    server: remoteServer,
    info: { url, port: remoteServer.port, qrDataUrl }
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.gambit.app')
  Menu.setApplicationMenu(null)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await startRemoteServer()
  } catch (error) {
    console.error('Не удалось запустить веб-сервер:', error)
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  remoteServer?.close()
})
