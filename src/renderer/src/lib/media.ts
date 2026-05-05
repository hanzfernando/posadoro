const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv'])

export function isVideoFile(filePathOrUrl?: string | null): boolean {
  if (!filePathOrUrl) return false

  const extension = filePathOrUrl.split(/[?#]/)[0]?.split('.').pop()?.toLowerCase()
  return extension ? VIDEO_EXTENSIONS.has(extension) : false
}
