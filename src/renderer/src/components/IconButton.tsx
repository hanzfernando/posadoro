export function IconButton({
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
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border-2 border-[#272522] bg-[#FFF8DF] text-[#272522] shadow-[3px_3px_0_#272522] transition-all hover:-translate-y-0.5 hover:bg-[#FFD66E] hover:shadow-[4px_4px_0_#272522] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}
