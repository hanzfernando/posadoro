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
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-2 border-[#2C2C2A] text-[#2C2C2A] transition-colors hover:bg-[#E8E5DC]"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}
