import type { Settings, TimerSnapshot } from '../types'

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath
}

export function getSessionLabel(timer: TimerSnapshot): string {
  if (timer.sessionType === 'work') {
    return `Focus session ${Math.min(timer.sessionCount + 1, timer.totalSessions)} / ${timer.totalSessions}`
  }
  const label = timer.sessionType === 'longBreak' ? 'Long break' : 'Short break'
  return `${label} ${timer.sessionCount} / ${timer.totalSessions}`
}

export function getNextSessionLabel(
  timer: TimerSnapshot,
  settings: Settings
): { label: string; minutes: number } {
  if (timer.sessionType !== 'work') {
    return { label: 'focus session', minutes: settings.workDuration }
  }
  const nextIsLong = (timer.sessionCount + 1) % timer.totalSessions === 0
  return nextIsLong
    ? { label: 'long break', minutes: settings.longBreak }
    : { label: 'short break', minutes: settings.shortBreak }
}
