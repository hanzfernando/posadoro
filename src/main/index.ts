import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  net,
  protocol,
  screen,
  shell,
  Tray
} from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import ElectronStore from 'electron-store'
import { existsSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'
import icon from '../../resources/icon.png?asset'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'posadoro-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true
    }
  }
])

type SessionType = 'work' | 'shortBreak' | 'longBreak'

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
}

type TimerSnapshot = {
  timeLeft: number
  totalSeconds: number
  sessionType: SessionType
  sessionCount: number
  totalSessions: number
  isPaused: boolean
}

type PresetCat = {
  id: string
  label: string
  file: string
}

type PresetCatPayload = PresetCat & {
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

const PRESET_CATS: PresetCat[] = [
  { id: 'cat-beg', label: 'begging cat', file: 'cat-beg.gif' },
  { id: 'cat-oia', label: 'oia cat', file: 'cat-oia.gif' }
]

const Store =
  (ElectronStore as unknown as { default?: typeof ElectronStore }).default ?? ElectronStore

const store = new Store<{ settings: Settings }>({
  defaults: {
    settings: DEFAULT_SETTINGS
  }
})

const state: TimerSnapshot & { interval: NodeJS.Timeout | null } = {
  timeLeft: DEFAULT_SETTINGS.workDuration * 60,
  totalSeconds: DEFAULT_SETTINGS.workDuration * 60,
  sessionType: 'work',
  sessionCount: 0,
  totalSessions: DEFAULT_SETTINGS.sessionsBeforeLong,
  isPaused: false,
  interval: null
}

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function getSettings(): Settings {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...store.get('settings', DEFAULT_SETTINGS)
  }
  return sanitizeSettings(settings)
}

function sanitizeSettings(settings: Settings): Settings {
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

function getAssetsPath(...parts: string[]): string {
  const candidateRoots = [
    app.isPackaged ? join(process.resourcesPath, 'assets') : null,
    // join(app.getAppPath(), 'assets'),
    join(app.getAppPath(), 'resources', 'assets'),
    join(process.cwd(), 'assets'),
    join(__dirname, '../../assets')
  ].filter((root): root is string => Boolean(root))

  const existingRoot = candidateRoots.find((root) => existsSync(root))
  return join(existingRoot ?? candidateRoots[0], ...parts)
}

function pathToUrl(filePath: string): string {
  return `posadoro-file://local/${encodeURIComponent(filePath)}`
}

function resolveGifPath(settings: Settings): string {
  if (settings.catGifPath && existsSync(settings.catGifPath)) return settings.catGifPath
  const preset = PRESET_CATS.find((cat) => cat.id === settings.catPresetId)
  if (preset) {
    const presetPath = getAssetsPath('cats', preset.file)
    if (existsSync(presetPath)) return presetPath
  }
  const fallbackPresetPath = getAssetsPath('cats', PRESET_CATS[0]?.file ?? '')
  if (existsSync(fallbackPresetPath)) return fallbackPresetPath
  return getAssetsPath('cat.gif')
}

function getSettingsPayload(): Settings & {
  resolvedCatGifPath: string
  resolvedCatGifUrl: string
} {
  const settings = getSettings()
  const resolvedCatGifPath = resolveGifPath(settings)
  return {
    ...settings,
    resolvedCatGifPath,
    resolvedCatGifUrl: pathToUrl(resolvedCatGifPath)
  }
}

function getPresetCatPayload(): PresetCatPayload[] {
  return PRESET_CATS.map((cat) => {
    const catPath = getAssetsPath('cats', cat.file)
    const fallbackPath = resolveGifPath({ ...getSettings(), catPresetId: cat.id, catGifPath: null })
    const resolvedPath = existsSync(catPath) ? catPath : fallbackPath
    return {
      ...cat,
      path: resolvedPath,
      url: pathToUrl(resolvedPath)
    }
  })
}

function getTrayIcon(): Electron.NativeImage | string {
  const trayIconPath = getAssetsPath('tray-icon.png')
  if (existsSync(trayIconPath)) {
    const image = nativeImage.createFromPath(trayIconPath)
    image.setTemplateImage(true)
    return image
  }
  return icon
}

function loadRenderer(window: BrowserWindow, page: 'mini' | 'overlay' | 'settings'): void {
  const pageQuery = page === 'mini' ? '' : `?window=${page}`
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${pageQuery}`)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'), {
      query: page === 'mini' ? undefined : { window: page }
    })
  }
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 260,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    backgroundColor: '#F1EFE8',
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  })

  

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (process.platform === 'darwin') app.dock?.show()
    sendTick()
  })

  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    hideMainWindow()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // mainWindow.webContents.openDevTools({ mode: 'detach' })

  loadRenderer(mainWindow, 'mini')
}

function createOverlayWindow(): void {
  destroyOverlayWindow()

  const display = screen.getPrimaryDisplay().bounds
  overlayWindow = new BrowserWindow({
    width: display.width,
    height: display.height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    focusable: false,
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  })

  overlayWindow.on('ready-to-show', () => {
    overlayWindow?.showInactive()
    sendTick()
  })

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })

  loadRenderer(overlayWindow, 'overlay')
}

function openSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 440,
    height: 660,
    frame: false,
    resizable: false,
    backgroundColor: '#F1EFE8',
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  loadRenderer(settingsWindow, 'settings')
}

function createTray(): void {
  if (!tray) {
    tray = new Tray(getTrayIcon())
    tray.on('click', () => showMainWindow())
  }
  rebuildTrayMenu()
}

function rebuildTrayMenu(): void {
  if (!tray) return
  const label = state.isPaused ? 'Resume' : 'Pause'
  tray.setToolTip(`Posadoro - ${formatTime(state.timeLeft)} remaining`)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show window', click: () => showMainWindow() },
      { type: 'separator' },
      { label, click: () => togglePause() },
      { label: 'Skip session', click: () => skipSession() },
      { type: 'separator' },
      { label: 'Settings', click: () => openSettingsWindow() },
      {
        label: 'Quit Posadoro',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])
  )
}

function showMainWindow(): void {
  mainWindow?.show()
  if (process.platform === 'darwin') app.dock?.show()
}

function hideMainWindow(): void {
  mainWindow?.hide()
  createTray()
  if (process.platform === 'darwin') app.dock?.hide()
}

function getSessionSeconds(type: SessionType): number {
  const settings = getSettings()
  if (type === 'work') return settings.workDuration * 60
  if (type === 'shortBreak') return settings.shortBreak * 60
  return settings.longBreak * 60
}

function setSession(type: SessionType): void {
  state.sessionType = type
  state.totalSeconds = getSessionSeconds(type)
  state.timeLeft = state.totalSeconds
  state.totalSessions = getSettings().sessionsBeforeLong
  state.isPaused = false
  startTimer()
  sendTick()
}

function startTimer(): void {
  clearTimer()
  state.interval = setInterval(() => {
    state.timeLeft = Math.max(0, state.timeLeft - 1)
    sendTick()
    if (state.timeLeft === 0) handleSessionEnd()
  }, 1000)
}

function clearTimer(): void {
  if (state.interval) clearInterval(state.interval)
  state.interval = null
}

function pauseTimer(): void {
  clearTimer()
  state.isPaused = true
  sendTick()
}

function resumeTimer(): void {
  if (!state.isPaused) return
  state.isPaused = false
  startTimer()
  sendTick()
}

function togglePause(): void {
  if (state.isPaused) resumeTimer()
  else pauseTimer()
}

function skipSession(): void {
  clearTimer()
  handleSessionEnd()
}

function resetTimer(): void {
  clearTimer()
  destroyOverlayWindow()
  state.sessionCount = 0
  setSession('work')
}

function handleSessionEnd(): void {
  clearTimer()
  if (state.sessionType === 'work') {
    state.sessionCount += 1
    const nextBreak =
      state.sessionCount % getSettings().sessionsBeforeLong === 0 ? 'longBreak' : 'shortBreak'
    createOverlayWindow()
    setSession(nextBreak)
    return
  }

  destroyOverlayWindow()
  setSession('work')
}

function destroyOverlayWindow(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.destroy()
  }
  overlayWindow = null
}

function sendTick(): void {
  const snapshot: TimerSnapshot = {
    timeLeft: state.timeLeft,
    totalSeconds: state.totalSeconds,
    sessionType: state.sessionType,
    sessionCount: state.sessionCount,
    totalSessions: state.totalSessions,
    isPaused: state.isPaused
  }
  mainWindow?.webContents.send('timer:tick', snapshot)
  overlayWindow?.webContents.send('timer:tick', snapshot)
  rebuildTrayMenu()
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function registerIpc(): void {
  ipcMain.on('timer:pause', () => pauseTimer())
  ipcMain.on('timer:resume', () => resumeTimer())
  ipcMain.on('timer:skip', () => skipSession())
  ipcMain.on('timer:reset', () => resetTimer())
  ipcMain.on('break:skip', () => {
    if (state.sessionType !== 'work') {
      clearTimer()
      destroyOverlayWindow()
      setSession('work')
    }
  })
  ipcMain.on('window:hide', () => hideMainWindow())
  ipcMain.on('window:open-settings', () => openSettingsWindow())
  ipcMain.on('window:close-settings', () => settingsWindow?.close())

  ipcMain.handle('settings:get', () => getSettingsPayload())
  ipcMain.handle('settings:set', (_, settings: Settings) => {
    const nextSettings = sanitizeSettings(settings)
    store.set('settings', nextSettings)
    state.totalSessions = nextSettings.sessionsBeforeLong
    if (!state.isPaused) {
      const elapsed = state.totalSeconds - state.timeLeft
      state.totalSeconds = getSessionSeconds(state.sessionType)
      state.timeLeft = Math.max(1, state.totalSeconds - elapsed)
    }
    sendTick()
    return getSettingsPayload()
  })
  ipcMain.handle('cats:get-presets', () => getPresetCatPayload())
  ipcMain.handle('file:to-url', (_, filePath: string) => pathToUrl(filePath))
  ipcMain.handle('dialog:select-gif', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Images', extensions: ['gif', 'png'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Debug handler to inspect asset resolution logic
  ipcMain.handle('debug:asset-info', () => {
  const settings = getSettings()
  const resolvedPath = resolveGifPath(settings)
  return {
    resolvedPath,
    exists: existsSync(resolvedPath),
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    dirname: __dirname,
    cwd: process.cwd(),
    isPackaged: app.isPackaged,
    candidates: [
      app.isPackaged ? join(process.resourcesPath, 'assets') : null,
      join(app.getAppPath(), 'assets'),
      join(process.cwd(), 'assets'),
      join(__dirname, '../../assets')
    ].filter(Boolean).map(p => ({ path: p, exists: existsSync(p!) }))
  }
})
}

app.whenReady().then(() => {
  console.log('App is ready')
  electronApp.setAppUserModelId('com.posadoro.app')

  protocol.handle('posadoro-file', (request) => {
    const encoded = request.url.replace('posadoro-file://local/', '')
    const filePath = decodeURIComponent(encoded)
    console.log('protocol hit, filePath:', filePath, 'exists:', existsSync(filePath))
    return net.fetch(pathToFileURL(filePath).toString())
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc()
  createTray()
  createMainWindow()
  resetTimer()

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) createMainWindow()
    showMainWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {})
