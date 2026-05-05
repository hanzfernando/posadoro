import { useEffect, useState } from 'react'

type SessionType = 'work' | 'shortBreak' | 'longBreak'

type TimerSnapshot = {
  timeLeft: number
  totalSeconds: number
  sessionType: SessionType
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

const DEFAULT_SETTINGS: Settings = {
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

const INITIAL_TIMER: TimerSnapshot = {
  timeLeft: 25 * 60,
  totalSeconds: 25 * 60,
  sessionType: 'work',
  sessionCount: 0,
  totalSessions: 4,
  isPaused: false
}

const RING_LENGTH = 263.9

function App(): React.JSX.Element {
  const page = new URLSearchParams(window.location.search).get('window')

  if (page === 'overlay') return <BreakOverlay />
  if (page === 'settings') return <SettingsWindow />
  return <MiniTimer />
}

function MiniTimer(): React.JSX.Element {
  const [timer, setTimer] = useState<TimerSnapshot>(INITIAL_TIMER)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => window.electronAPI.onTick(setTimer), [])
  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings)
  }, [])
  useEffect(() => {
    window.electronAPI.getSettings().then(s => {
      console.log('resolvedCatGifUrl:', s.resolvedCatGifUrl)
    })
  }, [])

  const progress =
    timer.totalSeconds > 0 ? (timer.totalSeconds - timer.timeLeft) / timer.totalSeconds : 0
  const dashOffset = RING_LENGTH * (1 - progress)
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
            strokeDasharray={RING_LENGTH}
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

function BreakOverlay(): React.JSX.Element {
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
    <main className="fixed inset-0 flex flex-col items-center justify-end gap-3 bg-transparent pb-12 [-webkit-app-region:no-drag]">
      <img
        id="cat-gif"
        className="h-auto max-h-[55vh] max-w-[90vw] object-contain"
        style={{ width: settings.catGifSize }}
        src={settings.resolvedCatGifUrl}
        onError={() => setCatFailed(true)}
        alt=""
      />
      {catFailed ? (
        <div className="rounded-lg bg-[#F1EFE8]/90 px-3 py-2 text-sm text-[#993C1D]">
          cat image could not load
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-1 text-center">
        <div className="text-5xl font-medium tabular-nums text-[#2C2C2A]">
          {formatTime(timer.timeLeft)}
        </div>
        <div className="max-w-[34rem] px-4 text-sm text-[#5F5E5A]">{settings.breakMessageText}</div>
      </div>

      <button
        className={`mt-2 cursor-pointer rounded-lg bg-[#2C2C2A] px-5 py-2 text-sm font-medium text-[#F1EFE8] ${
          dismissed ? 'hidden' : ''
        }`}
        onClick={dismiss}
      >
        dismiss
      </button>

      <div
        className={`px-4 text-center text-sm italic text-[#993C1D] ${dismissed ? '' : 'hidden'}`}
      >
        {settings.guiltMessageText}
      </div>
    </main>
  )
}

function SettingsWindow(): React.JSX.Element {
  const [formValues, setFormValues] = useState<Settings>(DEFAULT_SETTINGS)
  const [presets, setPresets] = useState<PresetCat[]>([])
  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([window.electronAPI.getSettings(), window.electronAPI.getPresetCats()]).then(
      ([settings, cats]) => {
        setFormValues(settings)
        setPresets(cats)
        if (settings.catGifPath) {
          window.electronAPI.fileToUrl(settings.catGifPath).then(setCustomPreviewUrl)
        }
      }
    )
  }, [])

  const selectedPreset = presets.find((preset) => preset.id === formValues.catPresetId)
  const previewSrc = formValues.catGifPath ? customPreviewUrl : selectedPreset?.url
  const previewLabel = formValues.catGifPath
    ? getFileName(formValues.catGifPath)
    : selectedPreset?.label || 'no cat selected'

  const updateField = <Key extends keyof Settings>(key: Key, value: Settings[Key]): void => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  const chooseCustomCat = async (): Promise<void> => {
    const filePath = await window.electronAPI.selectGif()
    if (!filePath) return
    const fileUrl = await window.electronAPI.fileToUrl(filePath)
    setCustomPreviewUrl(fileUrl)
    setFormValues((current) => ({
      ...current,
      catGifPath: filePath,
      catPresetId: null
    }))
  }

  const saveSettings = async (): Promise<void> => {
    await window.electronAPI.setSettings(formValues)
    window.electronAPI.closeSettings()
  }

  return (
    <main className="h-screen overflow-hidden bg-[#F1EFE8] text-[#2C2C2A]">
      <div className="flex h-9 items-center justify-between px-3 [-webkit-app-region:drag]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5F5E5A]">
          Settings
        </div>
        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-lg leading-none text-[#5F5E5A] hover:bg-[#D3D1C7] hover:text-[#2C2C2A] [-webkit-app-region:no-drag]"
          onClick={() => window.electronAPI.closeSettings()}
          aria-label="Close settings"
        >
          x
        </button>
      </div>

      <div className="flex h-[calc(100vh-36px)] flex-col gap-4 overflow-y-auto px-5 pb-5">
        <section className="flex flex-col gap-3 rounded-xl border-2 border-[#D3D1C7] bg-[#FBFAF5] p-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5F5E5A]">
              timer
            </div>
            <div className="mt-1 text-xs text-[#888780]">
              set the focus length, break lengths, and sessions before the long break
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="focus time"
              value={formValues.workDuration}
              min={1}
              max={90}
              onChange={(value) => updateField('workDuration', value)}
            />
            <NumberField
              label="short break"
              value={formValues.shortBreak}
              min={1}
              max={90}
              onChange={(value) => updateField('shortBreak', value)}
            />
            <NumberField
              label="long break"
              value={formValues.longBreak}
              min={1}
              max={120}
              onChange={(value) => updateField('longBreak', value)}
            />
            <NumberField
              label="sessions before long"
              value={formValues.sessionsBeforeLong}
              min={1}
              max={12}
              onChange={(value) => updateField('sessionsBeforeLong', value)}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border-2 border-[#D3D1C7] bg-[#FBFAF5] p-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5F5E5A]">
              break cat
            </div>
            <div className="mt-1 text-xs text-[#888780]">
              choose what appears on break and how large it should be
            </div>
          </div>
          <NumberField
            label="cat width"
            value={formValues.catGifSize}
            min={100}
            max={600}
            onChange={(value) => updateField('catGifSize', value)}
          />
          <div className="text-[11px] text-[#888780]">pick a preset</div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const selected = formValues.catPresetId === preset.id && !formValues.catGifPath
              return (
                <button
                  key={preset.id}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-2 transition-colors ${
                    selected ? 'border-[#2C2C2A] bg-[#F1EFE8]' : 'border-[#D3D1C7] bg-[#E8E5DC]'
                  }`}
                  onClick={() =>
                    setFormValues((current) => ({
                      ...current,
                      catPresetId: preset.id,
                      catGifPath: null
                    }))
                  }
                >
                  <img className="h-16 w-16 rounded-lg object-contain" src={preset.url} alt="" />
                  <span className="text-center text-[11px] text-[#5F5E5A]">{preset.label}</span>
                </button>
              )
            })}
          </div>

          <div className="pt-1 text-[11px] text-[#888780]">or upload your own</div>
          <button
            className="w-full cursor-pointer rounded-xl border-2 border-dashed border-[#B4B2A9] py-2 text-sm text-[#888780] transition-colors hover:border-[#2C2C2A] hover:text-[#2C2C2A]"
            onClick={chooseCustomCat}
          >
            + upload gif or png
          </button>

          <div className="flex w-full flex-col items-center gap-1 border-t border-[#D3D1C7] pt-3">
            {previewSrc ? (
              <img
                id="cat-preview"
                className="h-auto max-h-40 max-w-full object-contain"
                style={{ width: Math.min(formValues.catGifSize, 260) }}
                src={previewSrc}
                alt=""
              />
            ) : null}
            <span className="text-[11px] text-[#888780]">{previewLabel}</span>
          </div>
        </section>

        <TextAreaField
          label="break message"
          value={formValues.breakMessageText}
          onChange={(value) => updateField('breakMessageText', value)}
        />
        <TextAreaField
          label="guilt message"
          value={formValues.guiltMessageText}
          onChange={(value) => updateField('guiltMessageText', value)}
        />

        <button
          className="mb-1 mt-auto w-full cursor-pointer rounded-lg bg-[#2C2C2A] px-4 py-2 text-sm font-medium text-[#F1EFE8]"
          onClick={saveSettings}
        >
          Save
        </button>
      </div>
    </main>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5F5E5A]">
      {label}
      <input
        className="h-9 rounded-lg border-2 border-[#D3D1C7] bg-[#FBFAF5] px-2 text-sm font-medium tracking-normal text-[#2C2C2A] outline-none focus:border-[#2C2C2A]"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5F5E5A]">
      {label}
      <textarea
        className="min-h-20 resize-none rounded-lg border-2 border-[#D3D1C7] bg-[#FBFAF5] px-2 py-2 text-sm font-normal normal-case tracking-normal text-[#2C2C2A] outline-none focus:border-[#2C2C2A]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function IconButton({
  label,
  onClick,
  children
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-2 border-[#2C2C2A] text-[#2C2C2A] transition-colors hover:bg-[#E8E5DC]"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function ResetIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
    </svg>
  )
}

function PauseIcon(): React.JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <path d="M9 6v12" />
      <path d="M15 6v12" />
    </svg>
  )
}

function PlayIcon(): React.JSX.Element {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <path d="m9 6 9 6-9 6V6Z" />
    </svg>
  )
}

function SkipIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 5 8 7-8 7V5Z" />
      <path d="M19 5v14" />
    </svg>
  )
}

function GearIcon(): React.JSX.Element {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l-.1-.1A2 2 0 1 1 7 4l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1A2 2 0 1 1 20 7l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.1a1.8 1.8 0 0 0-1.7 1Z" />
    </svg>
  )
}

function getSessionLabel(timer: TimerSnapshot): string {
  if (timer.sessionType === 'work') {
    return `Focus session ${Math.min(timer.sessionCount + 1, timer.totalSessions)} / ${timer.totalSessions}`
  }
  const label = timer.sessionType === 'longBreak' ? 'Long break' : 'Short break'
  return `${label} ${timer.sessionCount} / ${timer.totalSessions}`
}

function getNextSessionLabel(
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

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath
}

export default App
