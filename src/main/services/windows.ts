import { app, BrowserWindow, screen, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import type { RendererPage, TimerSnapshot } from '../types'

type WindowManagerOptions = {
  onMainWindowReady: () => void
  onOverlayReady: () => void
  onMainWindowHide: () => void
  shouldQuit: () => boolean
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private overlayWindow: BrowserWindow | null = null
  private settingsWindow: BrowserWindow | null = null

  constructor(private readonly options: WindowManagerOptions) {}

  get main(): BrowserWindow | null {
    return this.mainWindow
  }

  get overlay(): BrowserWindow | null {
    return this.overlayWindow
  }

  createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 260,
      height: 360,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      backgroundColor: '#272522',
      show: false,
      webPreferences: getWindowPreferences()
    })

    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow?.show()
      if (process.platform === 'darwin') app.dock?.show()
      this.options.onMainWindowReady()
    })

    this.mainWindow.on('close', (event) => {
      if (this.options.shouldQuit()) return
      event.preventDefault()
      this.hideMainWindow()
    })

    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    loadRenderer(this.mainWindow, 'mini')
  }

  createOverlayWindow(): void {
    this.destroyOverlayWindow()

    const display = screen.getPrimaryDisplay().bounds
    this.overlayWindow = new BrowserWindow({
      width: display.width,
      height: display.height,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      backgroundColor: '#00000000',
      show: false,
      focusable: false,
      webPreferences: getWindowPreferences()
    })

    this.overlayWindow.on('ready-to-show', () => {
      this.overlayWindow?.showInactive()
      this.options.onOverlayReady()
    })

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null
    })

    loadRenderer(this.overlayWindow, 'overlay')
  }

  destroyOverlayWindow(): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.destroy()
    }
    this.overlayWindow = null
  }

  openSettingsWindow(): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.show()
      this.settingsWindow.focus()
      return
    }

    this.settingsWindow = new BrowserWindow({
      width: 440,
      height: 660,
      frame: false,
      resizable: false,
      backgroundColor: '#272522',
      webPreferences: getWindowPreferences()
    })

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null
    })

    loadRenderer(this.settingsWindow, 'settings')
  }

  closeSettingsWindow(): void {
    this.settingsWindow?.close()
  }

  showMainWindow(): void {
    this.mainWindow?.show()
    if (process.platform === 'darwin') app.dock?.show()
  }

  hideMainWindow(): void {
    this.mainWindow?.hide()
    this.options.onMainWindowHide()
    if (process.platform === 'darwin') app.dock?.hide()
  }

  sendTimerTick(snapshot: TimerSnapshot): void {
    this.mainWindow?.webContents.send('timer:tick', snapshot)
    this.overlayWindow?.webContents.send('timer:tick', snapshot)
  }
}

function getWindowPreferences(): Electron.BrowserWindowConstructorOptions['webPreferences'] {
  return {
    contextIsolation: true,
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false
  }
}

function loadRenderer(window: BrowserWindow, page: RendererPage): void {
  const pageQuery = page === 'mini' ? '' : `?window=${page}`
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${pageQuery}`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), {
      query: page === 'mini' ? undefined : { window: page }
    })
  }
}
