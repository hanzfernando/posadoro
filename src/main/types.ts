export type SessionType = 'work' | 'shortBreak' | 'longBreak'

export type Settings = {
  workDuration: number
  shortBreak: number
  longBreak: number
  sessionsBeforeLong: number
  catPresetId: string | null
  catGifPath: string | null
  catGifSize: number
  breakMessageText: string
  guiltMessageText: string
}

export type TimerSnapshot = {
  timeLeft: number
  totalSeconds: number
  sessionType: SessionType
  sessionCount: number
  totalSessions: number
  isPaused: boolean
}

export type PresetCat = {
  id: string
  label: string
  file: string
}

export type PresetCatPayload = PresetCat & {
  path: string
  url: string
}

export type SettingsPayload = Settings & {
  resolvedCatGifPath: string
  resolvedCatGifUrl: string
}

export type RendererPage = 'mini' | 'overlay' | 'settings'
