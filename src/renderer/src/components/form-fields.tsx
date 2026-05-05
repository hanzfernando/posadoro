export function NumberField({
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
    <label className="flex flex-col gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3933]">
      {label}
      <input
        className="h-10 rounded-md border-2 border-[#272522] bg-[#FFFDF2] px-2.5 text-sm font-bold tracking-normal text-[#272522] shadow-[3px_3px_0_#272522] outline-none transition-all focus:-translate-y-0.5 focus:bg-[#FFF8DF] focus:shadow-[4px_4px_0_#272522]"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function TextAreaField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3933]">
      {label}
      <textarea
        className="min-h-20 resize-none rounded-md border-2 border-[#272522] bg-[#FFFDF2] px-2.5 py-2 text-sm font-semibold normal-case tracking-normal text-[#272522] shadow-[3px_3px_0_#272522] outline-none transition-all focus:-translate-y-0.5 focus:bg-[#FFF8DF] focus:shadow-[4px_4px_0_#272522]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
