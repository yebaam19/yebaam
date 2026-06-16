function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const palettes = [
  ['#16a34a', '#0f766e'],
  ['#059669', '#0ea5e9'],
  ['#22c55e', '#14b8a6'],
  ['#65a30d', '#16a34a'],
  ['#0f172a', '#1d4ed8'],
]

export function buildVisualImageDataUrl(
  title: string,
  subtitle = '',
  accent = ''
) {
  const seed = hashString(`${title}-${subtitle}-${accent}`)
  const [from, to] = palettes[seed % palettes.length]
  const safeTitle = escapeXml((title || 'Yebaam').trim().slice(0, 32))
  const safeSubtitle = escapeXml((subtitle || '').trim().slice(0, 44))

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${from}" />
          <stop offset="100%" stop-color="${to}" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="36" />
        </filter>
      </defs>
      <rect width="1200" height="800" rx="48" fill="url(#bg)" />
      <circle cx="180" cy="140" r="110" fill="rgba(255,255,255,0.16)" filter="url(#blur)" />
      <circle cx="1020" cy="640" r="150" fill="rgba(255,255,255,0.14)" filter="url(#blur)" />
      <circle cx="980" cy="160" r="90" fill="rgba(255,255,255,0.12)" filter="url(#blur)" />
      <rect x="80" y="80" width="1040" height="640" rx="36" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" />
      <text x="600" y="370" text-anchor="middle" font-family="Poppins, Inter, Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff">${safeTitle}</text>
      <text x="600" y="445" text-anchor="middle" font-family="Poppins, Inter, Arial, sans-serif" font-size="34" font-weight="500" fill="rgba(255,255,255,0.88)">${safeSubtitle}</text>
      <text x="600" y="545" text-anchor="middle" font-family="Poppins, Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="rgba(255,255,255,0.75)">Yebaam</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`
}
