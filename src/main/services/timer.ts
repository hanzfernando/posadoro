import { DEFAULT_SETTINGS } from '../config/defaults'
import type { SessionType, Settings, TimerSnapshot } from '../types'

type TimerControllerOptions = {
  getSettings: () => Settings
  onBreakStart: () => void
  onBreakEnd: () => void
  onTick: (snapshot: TimerSnapshot) => void
}

export class TimerController {
  private state: TimerSnapshot & { interval: NodeJS.Timeout | null } = {
    timeLeft: DEFAULT_SETTINGS.workDuration * 60,
    totalSeconds: DEFAULT_SETTINGS.workDuration * 60,
    sessionType: 'work',
    sessionCount: 0,
    totalSessions: DEFAULT_SETTINGS.sessionsBeforeLong,
    isPaused: false,
    interval: null
  }

  constructor(private readonly options: TimerControllerOptions) {}

  get snapshot(): TimerSnapshot {
    return {
      timeLeft: this.state.timeLeft,
      totalSeconds: this.state.totalSeconds,
      sessionType: this.state.sessionType,
      sessionCount: this.state.sessionCount,
      totalSessions: this.state.totalSessions,
      isPaused: this.state.isPaused
    }
  }

  get isPaused(): boolean {
    return this.state.isPaused
  }

  get sessionType(): SessionType {
    return this.state.sessionType
  }

  reset(): void {
    this.clear()
    this.options.onBreakEnd()
    this.state.sessionCount = 0
    this.setSession('work')
  }

  pause(): void {
    this.clear()
    this.state.isPaused = true
    this.emitTick()
  }

  resume(): void {
    if (!this.state.isPaused) return
    this.state.isPaused = false
    this.start()
    this.emitTick()
  }

  togglePause(): void {
    if (this.state.isPaused) this.resume()
    else this.pause()
  }

  skip(): void {
    this.clear()
    this.handleSessionEnd()
  }

  skipBreak(): void {
    if (this.state.sessionType === 'work') return
    this.clear()
    this.options.onBreakEnd()
    this.setSession('work')
  }

  applySettings(settings: Settings): void {
    this.state.totalSessions = settings.sessionsBeforeLong
    if (!this.state.isPaused) {
      const elapsed = this.state.totalSeconds - this.state.timeLeft
      this.state.totalSeconds = this.getSessionSeconds(this.state.sessionType)
      this.state.timeLeft = Math.max(1, this.state.totalSeconds - elapsed)
    }
    this.emitTick()
  }

  clear(): void {
    if (this.state.interval) clearInterval(this.state.interval)
    this.state.interval = null
  }

  private setSession(type: SessionType): void {
    this.state.sessionType = type
    this.state.totalSeconds = this.getSessionSeconds(type)
    this.state.timeLeft = this.state.totalSeconds
    this.state.totalSessions = this.options.getSettings().sessionsBeforeLong
    this.state.isPaused = false
    this.start()
    this.emitTick()
  }

  private start(): void {
    this.clear()
    this.state.interval = setInterval(() => {
      this.state.timeLeft = Math.max(0, this.state.timeLeft - 1)
      this.emitTick()
      if (this.state.timeLeft === 0) this.handleSessionEnd()
    }, 1000)
  }

  private handleSessionEnd(): void {
    this.clear()

    if (this.state.sessionType === 'work') {
      this.state.sessionCount += 1
      const sessionsBeforeLong = this.options.getSettings().sessionsBeforeLong
      const nextBreak =
        this.state.sessionCount % sessionsBeforeLong === 0 ? 'longBreak' : 'shortBreak'

      this.options.onBreakStart()
      this.setSession(nextBreak)
      return
    }

    this.options.onBreakEnd()
    this.setSession('work')
  }

  private getSessionSeconds(type: SessionType): number {
    const settings = this.options.getSettings()
    if (type === 'work') return settings.workDuration * 60
    if (type === 'shortBreak') return settings.shortBreak * 60
    return settings.longBreak * 60
  }

  private emitTick(): void {
    this.options.onTick(this.snapshot)
  }
}
