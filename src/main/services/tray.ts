import { app, Menu, nativeImage, Tray } from 'electron'
import { existsSync } from 'fs'
import icon from '../../../resources/icon.png?asset'
import { getAssetsPath } from './assets'

type TrayManagerOptions = {
  getTimeLeft: () => number
  isPaused: () => boolean
  onShowWindow: () => void
  onTogglePause: () => void
  onSkipSession: () => void
  onOpenSettings: () => void
  onQuit: () => void
}

export class TrayManager {
  private tray: Tray | null = null

  constructor(private readonly options: TrayManagerOptions) {}

  create(): void {
    if (!this.tray) {
      this.tray = new Tray(getTrayIcon())
      this.tray.on('click', () => this.options.onShowWindow())
    }
    this.rebuildMenu()
  }

  rebuildMenu(): void {
    if (!this.tray) return

    const label = this.options.isPaused() ? 'Resume' : 'Pause'
    this.tray.setToolTip(`Posadoro - ${formatTime(this.options.getTimeLeft())} remaining`)
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Show window', click: () => this.options.onShowWindow() },
        { type: 'separator' },
        { label, click: () => this.options.onTogglePause() },
        { label: 'Skip session', click: () => this.options.onSkipSession() },
        { type: 'separator' },
        { label: 'Settings', click: () => this.options.onOpenSettings() },
        {
          label: 'Quit Posadoro',
          click: () => {
            this.options.onQuit()
            app.quit()
          }
        }
      ])
    )
  }
}

function getTrayIcon(): Electron.NativeImage | string {
  const trayIconPath = getAssetsPath('tray-icon.png')
  if (existsSync(trayIconPath)) {
    const image = nativeImage.createFromPath(trayIconPath)
    image.setTemplateImage(true)
    return image
  }
  return icon
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
