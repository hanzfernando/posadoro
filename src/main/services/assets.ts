import { app, net, protocol } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { PRESET_CATS } from '../config/defaults'
import type { PresetCatPayload, Settings, SettingsPayload } from '../types'
import { getSettings } from './settings'

const ASSET_PROTOCOL = 'posadoro-file'
const ASSET_URL_PREFIX = `${ASSET_PROTOCOL}://local/`

export function registerAssetProtocolScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: ASSET_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        stream: true,
        supportFetchAPI: true
      }
    }
  ])
}

export function registerAssetProtocolHandler(): void {
  protocol.handle(ASSET_PROTOCOL, (request) => {
    const encoded = request.url.replace(ASSET_URL_PREFIX, '')
    const filePath = decodeURIComponent(encoded)
    return net.fetch(pathToFileURL(filePath).toString())
  })
}

export function getAssetsPath(...parts: string[]): string {
  const candidateRoots = getAssetRootCandidates()
  const existingRoot = candidateRoots.find((root) => existsSync(root))
  return join(existingRoot ?? candidateRoots[0], ...parts)
}

export function pathToAssetUrl(filePath: string): string {
  return `${ASSET_URL_PREFIX}${encodeURIComponent(filePath)}`
}

export function resolveCatGifPath(settings: Settings): string {
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

export function getSettingsPayload(): SettingsPayload {
  const settings = getSettings()
  const resolvedCatGifPath = resolveCatGifPath(settings)
  return {
    ...settings,
    resolvedCatGifPath,
    resolvedCatGifUrl: pathToAssetUrl(resolvedCatGifPath)
  }
}

export function getPresetCatPayload(): PresetCatPayload[] {
  return PRESET_CATS.map((cat) => {
    const catPath = getAssetsPath('cats', cat.file)
    const fallbackPath = resolveCatGifPath({
      ...getSettings(),
      catPresetId: cat.id,
      catGifPath: null
    })
    const resolvedPath = existsSync(catPath) ? catPath : fallbackPath

    return {
      ...cat,
      path: resolvedPath,
      url: pathToAssetUrl(resolvedPath)
    }
  })
}

export function getAssetDebugInfo(): object {
  const settings = getSettings()
  const resolvedPath = resolveCatGifPath(settings)

  return {
    resolvedPath,
    exists: existsSync(resolvedPath),
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    dirname: __dirname,
    cwd: process.cwd(),
    isPackaged: app.isPackaged,
    candidates: getAssetRootCandidates().map((path) => ({
      path,
      exists: existsSync(path)
    }))
  }
}

function getAssetRootCandidates(): string[] {
  return [
    app.isPackaged ? join(process.resourcesPath, 'assets') : null,
    join(app.getAppPath(), 'resources', 'assets'),
    join(process.cwd(), 'assets'),
    join(__dirname, '../../assets')
  ].filter((root): root is string => Boolean(root))
}
