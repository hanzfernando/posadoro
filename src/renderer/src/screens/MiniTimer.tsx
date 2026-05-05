import { useEffect, useState } from 'react'
import { IconButton } from '../components/IconButton'
import { GearIcon, PauseIcon, PlayIcon, ResetIcon, SkipIcon } from '../components/icons'
import { DEFAULT_SETTINGS, INITIAL_TIMER, TIMER_RING_LENGTH } from '../constants'
import { formatTime, getNextSessionLabel, getSessionLabel } from '../lib/format'
import type { Settings, TimerSnapshot } from '../types'

export function MiniTimer(): React.JSX.Element {
  const [timer, setTimer] = useState<TimerSnapshot>(INITIAL_TIMER)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => window.electronAPI.onTick(setTimer), [])
  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings)
  }, [])

  const progress =
    timer.totalSeconds > 0 ? (timer.totalSeconds - timer.timeLeft) / timer.totalSeconds : 0
  const dashOffset = TIMER_RING_LENGTH * (1 - progress)
  const next = getNextSessionLabel(timer, settings)

  return (
    <main className="flex h-screen flex-col items-center overflow-hidden border-2 border-[#272522] bg-[#F8E6A6] text-[#272522] shadow-[inset_0_0_0_4px_#FFF8DF]">
      <div className="flex h-9 w-full items-center justify-between border-b-2 border-[#272522] bg-[#F08D65] px-2 [-webkit-app-region:drag]">
        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border-2 border-[#272522] bg-[#FFF8DF] text-[#272522] shadow-[2px_2px_0_#272522] transition-all hover:-translate-y-0.5 hover:bg-[#FFD66E] [-webkit-app-region:no-drag]"
          onClick={() => window.electronAPI.openSettings()}
          aria-label="Open settings"
        >
          <GearIcon />
        </button>
        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border-2 border-[#272522] bg-[#FFF8DF] text-base font-black leading-none text-[#272522] shadow-[2px_2px_0_#272522] transition-all hover:-translate-y-0.5 hover:bg-[#FFD66E] [-webkit-app-region:no-drag]"
          onClick={() => window.electronAPI.hideWindow()}
          aria-label="Hide Posadoro"
        >
          x
        </button>
      </div>

      <div className="mt-3 border-2 border-[#272522] bg-[#FFF8DF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#272522] shadow-[3px_3px_0_#272522]">
        {getSessionLabel(timer)}
      </div>

      <div className="relative mt-4 h-40 w-40 rounded-md border-2 border-[#272522] bg-[#FFFDF2] p-2 shadow-[6px_6px_0_#272522]">
        <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" stroke="#F8E6A6" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#272522"
            strokeWidth="8"
            fill="none"
            strokeDasharray={TIMER_RING_LENGTH}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[2.35rem] font-black tabular-nums">
          {formatTime(timer.timeLeft)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <IconButton label="Reset" onClick={() => window.electronAPI.reset()}>
          <ResetIcon />
        </IconButton>
        <button
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border-2 border-[#272522] bg-[#272522] text-[#FFF8DF] shadow-[4px_4px_0_#F08D65] transition-all hover:-translate-y-0.5 hover:bg-[#3A3933] hover:shadow-[5px_5px_0_#F08D65] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          onClick={() =>
            timer.isPaused ? window.electronAPI.resume() : window.electronAPI.pause()
          }
          aria-label={timer.isPaused ? 'Resume' : 'Pause'}
        >
          {timer.isPaused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <IconButton label="Skip" onClick={() => window.electronAPI.skip()}>
          <SkipIcon />
        </IconButton>
      </div>

      <footer className="mt-auto flex h-10 w-full items-center justify-center border-t-2 border-[#272522] bg-[#FFF8DF] text-[11px] font-bold text-[#3A3933]">
        next: {next.label} - {next.minutes} min
      </footer>
    </main>
  )
}
