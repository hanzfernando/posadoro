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
    <main className="h-screen overflow-hidden border-2 border-[#272522] bg-[#F8E6A6] text-[#272522] shadow-[inset_0_0_0_4px_#FFF8DF]">
      <div className="flex h-10 items-center justify-between border-b-2 border-[#272522] bg-[#F08D65] px-3 [-webkit-app-region:drag]">
        <div className="border-2 border-[#272522] bg-[#FFF8DF] px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#272522] shadow-[2px_2px_0_#272522]">
          Settings
        </div>
        <button
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border-2 border-[#272522] bg-[#FFF8DF] text-base font-black leading-none text-[#272522] shadow-[2px_2px_0_#272522] transition-all hover:-translate-y-0.5 hover:bg-[#FFD66E] [-webkit-app-region:no-drag]"
          onClick={() => window.electronAPI.closeSettings()}
          aria-label="Close settings"
        >
          x
        </button>
      </div>

      <div className="flex h-[calc(100vh-40px)] flex-col gap-5 overflow-y-auto px-5 pb-6 pt-5">
        <section className="flex flex-col gap-3 rounded-md border-2 border-[#272522] bg-[#FFF8DF] p-3 shadow-[5px_5px_0_#272522]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#272522]">
              timer
            </div>
            <div className="mt-1 text-xs font-semibold text-[#6B5D45]">
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

        <section className="flex flex-col gap-3 rounded-md border-2 border-[#272522] bg-[#FFF8DF] p-3 shadow-[5px_5px_0_#272522]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#272522]">
              break cat
            </div>
            <div className="mt-1 text-xs font-semibold text-[#6B5D45]">
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
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3933]">
            pick a preset
          </div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const selected = formValues.catPresetId === preset.id && !formValues.catGifPath
              return (
                <button
                  key={preset.id}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 p-2 shadow-[3px_3px_0_#272522] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#272522] ${
                    selected
                      ? 'border-[#272522] bg-[#FFD66E]'
                      : 'border-[#272522] bg-[#FFFDF2] hover:bg-[#F8E6A6]'
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
                      className="h-16 w-16 rounded-sm border-2 border-[#272522] bg-[#FFF8DF] object-contain"
                      src={preset.url}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      className="h-16 w-16 rounded-sm border-2 border-[#272522] bg-[#FFF8DF] object-contain"
                      src={preset.url}
                      alt=""
                    />
                  )}
                  <span className="text-center text-[11px] font-bold text-[#3A3933]">
                    {preset.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="pt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3933]">
            or upload your own
          </div>
          <button
            className="w-full cursor-pointer rounded-md border-2 border-dashed border-[#272522] bg-[#FFFDF2] py-2 text-sm font-black text-[#3A3933] shadow-[3px_3px_0_#272522] transition-all hover:-translate-y-0.5 hover:bg-[#FFD66E] hover:shadow-[4px_4px_0_#272522]"
            onClick={chooseCustomCat}
          >
            + upload image or video
          </button>

          <div className="flex w-full flex-col items-center gap-2 border-t-2 border-[#272522] pt-3">
            {previewSrc && previewIsVideo ? (
              <video
                id="cat-preview"
                className="h-auto max-h-40 max-w-full rounded-sm border-2 border-[#272522] bg-[#FFFDF2] object-contain shadow-[4px_4px_0_#272522]"
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
                className="h-auto max-h-40 max-w-full rounded-sm border-2 border-[#272522] bg-[#FFFDF2] object-contain shadow-[4px_4px_0_#272522]"
                style={{ width: Math.min(formValues.catGifSize, 260) }}
                src={previewSrc}
                alt=""
              />
            ) : null}
            <span className="text-center text-[11px] font-bold text-[#6B5D45]">{previewLabel}</span>
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
          className="mb-1 mt-auto w-full cursor-pointer rounded-md border-2 border-[#272522] bg-[#272522] px-4 py-2.5 text-sm font-black uppercase tracking-[0.08em] text-[#FFF8DF] shadow-[5px_5px_0_#F08D65] transition-all hover:-translate-y-0.5 hover:bg-[#3A3933] hover:shadow-[6px_6px_0_#F08D65] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          onClick={saveSettings}
        >
          Save
        </button>
      </div>
    </main>
  )
}
