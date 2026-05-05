import type { Settings, TimerSnapshot } from './types'

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4,
  catPresetId: 'cat-beg',
  catGifPath: null,
  catGifSize: 320,
  breakMessageText: 'you earned this break. stretch, hydrate, stare into the void.',
  guiltMessageText: "fine. go back to work. i didn't want to spend time with you anyway."
}

export const INITIAL_TIMER: TimerSnapshot = {
  timeLeft: 25 * 60,
  totalSeconds: 25 * 60,
  sessionType: 'work',
  sessionCount: 0,
  totalSessions: 4,
  isPaused: false
}

export const TIMER_RING_LENGTH = 263.9
