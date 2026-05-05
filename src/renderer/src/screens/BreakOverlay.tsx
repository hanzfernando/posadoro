import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, INITIAL_TIMER } from '../constants'
import { formatTime } from '../lib/format'
import type { Settings, TimerSnapshot } from '../types'

export function BreakOverlay(): React.JSX.Element {
  const [timer, setTimer] = useState<TimerSnapshot>(INITIAL_TIMER)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [dismissed, setDismissed] = useState(false)
  const [catFailed, setCatFailed] = useState(false)

  useEffect(() => window.electronAPI.onTick(setTimer), [])
  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings)
  }, [])

  const dismiss = (): void => {
    setDismissed(true)
    window.setTimeout(() => window.electronAPI.skipBreak(), 2000)
  }

  return (
    <main
      className="fixed inset-0 flex flex-col items-center justify-end gap-4 pb-12 [-webkit-app-region:no-drag]"
      style={{ background: 'rgba(18, 17, 15, 0.82)' }}
    >
      <img
        id="cat-gif"
        className="h-auto max-h-[55vh] max-w-[90vw] object-contain drop-shadow-2xl"
        style={{ width: settings.catGifSize }}
        src={settings.resolvedCatGifUrl}
        onError={() => setCatFailed(true)}
        alt=""
      />
      {catFailed ? (
        <div
          className="border-2 px-3 py-2 text-sm font-bold uppercase tracking-widest"
          style={{
            background: '#1A1916',
            borderColor: '#D95F3B',
            color: '#D95F3B',
          }}
        >
          cat image could not load
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className="tabular-nums leading-none"
          style={{
            fontSize: 'clamp(4rem, 12vw, 6rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#F5F2EA',
            textShadow: '0 2px 24px rgba(245,242,234,0.18)',
          }}
        >
          {formatTime(timer.timeLeft)}
        </div>
        <div
          className="max-w-[32rem] px-4 text-sm font-semibold uppercase tracking-[0.12em]"
          style={{ color: '#B8B39E' }}
        >
          {settings.breakMessageText}
        </div>
      </div>

      <button
        className={`mt-1 cursor-pointer border-2 px-6 py-2 text-sm font-black uppercase tracking-widest transition-colors duration-150 ${
          dismissed ? 'hidden' : ''
        }`}
        style={{
          background: 'transparent',
          borderColor: '#F5F2EA',
          color: '#F5F2EA',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.background = '#F5F2EA'
          el.style.color = '#12110F'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.background = 'transparent'
          el.style.color = '#F5F2EA'
        }}
        onClick={dismiss}
      >
        dismiss
      </button>

      <div
        className={`px-4 text-center text-xs font-bold uppercase tracking-[0.15em] ${dismissed ? '' : 'hidden'}`}
        style={{ color: '#D95F3B' }}
      >
        {settings.guiltMessageText}
      </div>
    </main>
  )
}