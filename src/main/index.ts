import { app } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import {
  registerAssetProtocolHandler,
  registerAssetProtocolScheme
} from './services/assets'
import { registerIpc } from './services/ipc'
import { getSettings } from './services/settings'
import { TimerController } from './services/timer'
import { TrayManager } from './services/tray'
import { WindowManager } from './services/windows'

registerAssetProtocolScheme()
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

let isQuitting = false

const windows = new WindowManager({
  onMainWindowReady: () => sendTick(),
  onOverlayReady: () => sendTick(),
  onMainWindowHide: () => tray.create(),
  shouldQuit: () => isQuitting
})

const timer = new TimerController({
  getSettings,
  onBreakStart: () => windows.createOverlayWindow(),
  onBreakEnd: () => windows.destroyOverlayWindow(),
  onTick: (snapshot) => {
    windows.sendTimerTick(snapshot)
    tray.rebuildMenu()
  }
})

const tray = new TrayManager({
  getTimeLeft: () => timer.snapshot.timeLeft,
  isPaused: () => timer.isPaused,
  onShowWindow: () => windows.showMainWindow(),
  onTogglePause: () => timer.togglePause(),
  onSkipSession: () => timer.skip(),
  onOpenSettings: () => windows.openSettingsWindow(),
  onQuit: () => {
    isQuitting = true
  }
})

function sendTick(): void {
  windows.sendTimerTick(timer.snapshot)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.posadoro.app')
  registerAssetProtocolHandler()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc({ timer, windows })
  tray.create()
  windows.createMainWindow()
  timer.reset()

  app.on('activate', () => {
    if (!windows.main || windows.main.isDestroyed()) windows.createMainWindow()
    windows.showMainWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {})
