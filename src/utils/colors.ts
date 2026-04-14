const TEAM_COLORS: Record<string, string> = {
  'Zuid Jos': '#e53e3e',
  'Noord': '#3182ce',
  'Zuid Amy': '#38a169',
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getTeamColor(teamName: string): string {
  if (TEAM_COLORS[teamName]) {
    return TEAM_COLORS[teamName]
  }
  const hue = hashString(teamName) % 360
  return `hsl(${hue}, 65%, 45%)`
}

export function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!match) return hsl
  const h = parseInt(match[1]) / 360
  const s = parseInt(match[2]) / 100
  const l = parseInt(match[3]) / 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function getTeamColorHex(teamName: string): string {
  const color = getTeamColor(teamName)
  if (color.startsWith('hsl')) {
    return hslToHex(color)
  }
  return color
}
