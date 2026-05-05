import { ElectronAPI } from '@electron-toolkit/preload'

type TimerSnapshot = {
  timeLeft: number
  totalSeconds: number
  sessionType: 'work' | 'shortBreak' | 'longBreak'
  sessionCount: number
  totalSessions: number
  isPaused: boolean
}

type PosadoroSettings = {
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

type PosadoroAPI = {
  onTick: (callback: (snapshot: TimerSnapshot) => void) => () => void
  pause: () => void
  resume: () => void
  skip: () => void
  reset: () => void
  skipBreak: () => void
  hideWindow: () => void
  openSettings: () => void
  closeSettings: () => void
  getSettings: () => Promise<PosadoroSettings>
  setSettings: (settings: PosadoroSettings) => Promise<PosadoroSettings>
  selectGif: () => Promise<string | null>
  getPresetCats: () => Promise<PresetCat[]>
  fileToUrl: (filePath: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: PosadoroAPI
  }
}
