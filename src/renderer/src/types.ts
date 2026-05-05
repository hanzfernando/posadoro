export type SessionType = 'work' | 'shortBreak' | 'longBreak'

export type TimerSnapshot = {
  timeLeft: number
  totalSeconds: number
  sessionType: SessionType
  sessionCount: number
  totalSessions: number
  isPaused: boolean
}

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
  resolvedCatGifPath?: string
  resolvedCatGifUrl?: string
}

export type PresetCat = {
  id: string
  label: string
  file: string
  path: string
  url: string
}
