import { useEffect, useState } from 'react'
import { NumberField, TextAreaField } from '../components/form-fields'
import { DEFAULT_SETTINGS } from '../constants'
import { getFileName } from '../lib/format'
import { isVideoFile } from '../lib/media'
import type { PresetCat, Settings } from '../types'

export function SettingsWindow(): React.JSX.Element {
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
  const previewIsVideo = formValues.catGifPath
    ? isVideoFile(formValues.catGifPath)
    : isVideoFile(selectedPreset?.path)
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
                  {isVideoFile(preset.path) ? (
                    <video
                      className="h-16 w-16 rounded-lg object-contain"
                      src={preset.url}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img className="h-16 w-16 rounded-lg object-contain" src={preset.url} alt="" />
                  )}
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
            + upload image or video
          </button>

          <div className="flex w-full flex-col items-center gap-1 border-t border-[#D3D1C7] pt-3">
            {previewSrc && previewIsVideo ? (
              <video
                id="cat-preview"
                className="h-auto max-h-40 max-w-full object-contain"
                style={{ width: Math.min(formValues.catGifSize, 260) }}
                src={previewSrc}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : previewSrc ? (
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
