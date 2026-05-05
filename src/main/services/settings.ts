import ElectronStore from 'electron-store'
import { existsSync } from 'fs'
import { DEFAULT_SETTINGS } from '../config/defaults'
import type { Settings } from '../types'

const Store =
  (ElectronStore as unknown as { default?: typeof ElectronStore }).default ?? ElectronStore

const store = new Store<{ settings: Settings }>({
  defaults: {
    settings: DEFAULT_SETTINGS
  }
})

export function getSettings(): Settings {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...store.get('settings', DEFAULT_SETTINGS)
  }
  return sanitizeSettings(settings)
}

export function saveSettings(settings: Settings): Settings {
  const nextSettings = sanitizeSettings(settings)
  store.set('settings', nextSettings)
  return nextSettings
}

export function sanitizeSettings(settings: Settings): Settings {
  const hasValidCustomCat = Boolean(settings.catGifPath && existsSync(settings.catGifPath))

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    workDuration: clampNumber(settings.workDuration, 1, 90, DEFAULT_SETTINGS.workDuration),
    shortBreak: clampNumber(settings.shortBreak, 1, 90, DEFAULT_SETTINGS.shortBreak),
    longBreak: clampNumber(settings.longBreak, 1, 120, DEFAULT_SETTINGS.longBreak),
    sessionsBeforeLong: clampNumber(
      settings.sessionsBeforeLong,
      1,
      12,
      DEFAULT_SETTINGS.sessionsBeforeLong
    ),
    catGifSize: clampNumber(settings.catGifSize, 100, 600, DEFAULT_SETTINGS.catGifSize),
    catPresetId: hasValidCustomCat ? null : settings.catPresetId || DEFAULT_SETTINGS.catPresetId,
    catGifPath: hasValidCustomCat ? settings.catGifPath : null
  }
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}
