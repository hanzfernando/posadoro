import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type TimerSnapshot = {
  timeLeft: number
  totalSeconds: number
  sessionType: 'work' | 'shortBreak' | 'longBreak'
  sessionCount: number
  totalSessions: number
  isPaused: boolean
}

type Settings = {
  workDuration: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLong: number
  catPresetId: string | null
  catGifPath: string | null
  catGifSize: number
  breakMessageText: string
  guiltMessageText: string
  resolvedCatGifPath?: string
  resolvedCatGifUrl?: string
}

type PresetCat = {
  id: string
  label: string
  file: string
  path: string
  url: string
}

declare global {
  interface Window {
    electron: typeof electronAPI
    electronAPI: typeof api
  }
}

const api = {
  onTick: (callback: (snapshot: TimerSnapshot) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: TimerSnapshot): void => {
      callback(snapshot)
    }
    ipcRenderer.on('timer:tick', listener)
    return () => ipcRenderer.removeListener('timer:tick', listener)
  },
  pause: () => ipcRenderer.send('timer:pause'),
  resume: () => ipcRenderer.send('timer:resume'),
  skip: () => ipcRenderer.send('timer:skip'),
  reset: () => ipcRenderer.send('timer:reset'),
  skipBreak: () => ipcRenderer.send('break:skip'),
  hideWindow: () => ipcRenderer.send('window:hide'),
  openSettings: () => ipcRenderer.send('window:open-settings'),
  closeSettings: () => ipcRenderer.send('window:close-settings'),
  getSettings: () => ipcRenderer.invoke('settings:get') as Promise<Settings>,
  setSettings: (settings: Settings) =>
    ipcRenderer.invoke('settings:set', settings) as Promise<Settings>,
  selectGif: () => ipcRenderer.invoke('dialog:select-gif') as Promise<string | null>,
  getPresetCats: () => ipcRenderer.invoke('cats:get-presets') as Promise<PresetCat[]>,
  fileToUrl: (filePath: string) => ipcRenderer.invoke('file:to-url', filePath) as Promise<string>
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.electronAPI = api
}
