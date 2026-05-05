import type { PresetCat, Settings } from '../types'

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

export const PRESET_CATS: PresetCat[] = [
  { id: 'cat-beg', label: 'begging cat', file: 'cat-beg.gif' },
  { id: 'cat-oia', label: 'oia cat', file: 'cat-oia.gif' }
]
