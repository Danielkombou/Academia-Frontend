export interface NameFormatOptions {
  fullNamesCount: number
  abbreviationsCount: number
}

export const formatCertificateName = (raw: string, options: NameFormatOptions = { fullNamesCount: 2, abbreviationsCount: 999 }): string => {
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return raw

  const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  const fullCount = Math.min(options.fullNamesCount, parts.length)
  const full = parts.slice(0, fullCount).map(titleCase)
  
  const remaining = parts.slice(fullCount)
  const abbrCount = Math.min(options.abbreviationsCount, remaining.length)
  const initials = remaining.slice(0, abbrCount).map(p => `${p.charAt(0).toUpperCase()}.`)

  return [...full, ...initials].join(' ')
}