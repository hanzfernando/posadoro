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
