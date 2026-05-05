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
    <main className="flex h-screen flex-col items-center bg-[#F1EFE8] text-[#2C2C2A]">
      <div className="flex h-8 w-full items-center justify-between px-2 [-webkit-app-region:drag]">
        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[#5F5E5A] transition-colors hover:bg-[#D3D1C7] hover:text-[#2C2C2A] [-webkit-app-region:no-drag]"
          onClick={() => window.electronAPI.openSettings()}
          aria-label="Open settings"
        >
          <GearIcon />
        </button>
        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-lg leading-none text-[#5F5E5A] transition-colors hover:bg-[#D3D1C7] hover:text-[#2C2C2A] [-webkit-app-region:no-drag]"
          onClick={() => window.electronAPI.hideWindow()}
          aria-label="Hide Posadoro"
        >
          x
        </button>
      </div>

      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5F5E5A]">
        {getSessionLabel(timer)}
      </div>

      <div className="relative mt-4 h-40 w-40">
        <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" stroke="#D3D1C7" strokeWidth="7" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="#2C2C2A"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={TIMER_RING_LENGTH}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-medium tabular-nums">
          {formatTime(timer.timeLeft)}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <IconButton label="Reset" onClick={() => window.electronAPI.reset()}>
          <ResetIcon />
        </IconButton>
        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 border-[#2C2C2A] bg-[#2C2C2A] text-[#F1EFE8] transition-transform hover:scale-105"
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

      <footer className="mt-auto flex h-10 w-full items-center justify-center border-t border-[#D3D1C7] text-[11px] text-[#5F5E5A]">
        next: {next.label} - {next.minutes} min
      </footer>
    </main>
  )
}
