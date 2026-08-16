export const formatCertificateName = (raw: string): string => {
  const parts = raw.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return raw

  const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  const full = parts.slice(0, 2).map(titleCase)
  const initials = parts.slice(2).map(p => `${p.charAt(0).toUpperCase()}.`)

  return [...full, ...initials].join(' ')
}