import { dialog, ipcMain } from 'electron'
import type { Settings } from '../types'
import {
  getAssetDebugInfo,
  getPresetCatPayload,
  getSettingsPayload,
  pathToAssetUrl
} from './assets'
import { saveSettings } from './settings'
import { TimerController } from './timer'
import { WindowManager } from './windows'

type IpcDependencies = {
  timer: TimerController
  windows: WindowManager
}

export function registerIpc({ timer, windows }: IpcDependencies): void {
  ipcMain.on('timer:pause', () => timer.pause())
  ipcMain.on('timer:resume', () => timer.resume())
  ipcMain.on('timer:skip', () => timer.skip())
  ipcMain.on('timer:reset', () => timer.reset())
  ipcMain.on('break:skip', () => timer.skipBreak())
  ipcMain.on('window:hide', () => windows.hideMainWindow())
  ipcMain.on('window:open-settings', () => windows.openSettingsWindow())
  ipcMain.on('window:close-settings', () => windows.closeSettingsWindow())

  ipcMain.handle('settings:get', () => getSettingsPayload())
  ipcMain.handle('settings:set', (_, settings: Settings) => {
    const nextSettings = saveSettings(settings)
    timer.applySettings(nextSettings)
    return getSettingsPayload()
  })
  ipcMain.handle('cats:get-presets', () => getPresetCatPayload())
  ipcMain.handle('file:to-url', (_, filePath: string) => pathToAssetUrl(filePath))
  ipcMain.handle('dialog:select-gif', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Images', extensions: ['gif', 'png'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })
  ipcMain.handle('debug:asset-info', () => getAssetDebugInfo())
}
