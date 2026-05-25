// Flag emojis + primary/secondary flag hex colors for all 48 WC 2026 teams.
// Primary = most prominent flag color. Secondary = second color or complement.
// Used for champion-themed UI accents.

type TeamMeta = { flag: string; colors: [string, string] }

export const TEAM_META: Record<string, TeamMeta> = {
  // Group A
  MEX: { flag: '🇲🇽', colors: ['#006847', '#CE1126'] },
  RSA: { flag: '🇿🇦', colors: ['#007A4D', '#FFB612'] },
  KOR: { flag: '🇰🇷', colors: ['#003478', '#CD2E3A'] },
  CZE: { flag: '🇨🇿', colors: ['#D7141A', '#11457E'] },
  // Group B
  CAN: { flag: '🇨🇦', colors: ['#FF0000', '#FFFFFF'] },
  BIH: { flag: '🇧🇦', colors: ['#002395', '#FECB00'] },
  QAT: { flag: '🇶🇦', colors: ['#8D1B3D', '#FFFFFF'] },
  SUI: { flag: '🇨🇭', colors: ['#FF0000', '#FFFFFF'] },
  // Group C
  BRA: { flag: '🇧🇷', colors: ['#009C3B', '#FFDF00'] },
  MAR: { flag: '🇲🇦', colors: ['#C1272D', '#006233'] },
  HAI: { flag: '🇭🇹', colors: ['#00209F', '#D21034'] },
  SCO: { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', colors: ['#003F87', '#FFFFFF'] },
  // Group D
  USA: { flag: '🇺🇸', colors: ['#B22234', '#3C3B6E'] },
  PAR: { flag: '🇵🇾', colors: ['#D52B1E', '#0038A8'] },
  AUS: { flag: '🇦🇺', colors: ['#00008B', '#FFCC00'] },
  TUR: { flag: '🇹🇷', colors: ['#E30A17', '#FFFFFF'] },
  // Group E
  GER: { flag: '🇩🇪', colors: ['#000000', '#DD0000'] },
  CUW: { flag: '🇨🇼', colors: ['#002B7F', '#F9E814'] },
  CIV: { flag: '🇨🇮', colors: ['#F77F00', '#009A44'] },
  ECU: { flag: '🇪🇨', colors: ['#FFD100', '#003DA5'] },
  // Group F
  NED: { flag: '🇳🇱', colors: ['#FF6600', '#1E4785'] },
  JPN: { flag: '🇯🇵', colors: ['#BC002D', '#FFFFFF'] },
  TUN: { flag: '🇹🇳', colors: ['#E70013', '#FFFFFF'] },
  SWE: { flag: '🇸🇪', colors: ['#006AA7', '#FECC02'] },
  // Group G
  BEL: { flag: '🇧🇪', colors: ['#000000', '#EF3340'] },
  EGY: { flag: '🇪🇬', colors: ['#CE1126', '#000000'] },
  IRN: { flag: '🇮🇷', colors: ['#239F40', '#DA0000'] },
  NZL: { flag: '🇳🇿', colors: ['#00247D', '#CC142B'] },
  // Group H
  ESP: { flag: '🇪🇸', colors: ['#C60B1E', '#FFC400'] },
  CPV: { flag: '🇨🇻', colors: ['#003893', '#CF2027'] },
  KSA: { flag: '🇸🇦', colors: ['#006C35', '#FFFFFF'] },
  URU: { flag: '🇺🇾', colors: ['#5EB6E4', '#FFFFFF'] },
  // Group I
  FRA: { flag: '🇫🇷', colors: ['#002395', '#ED2939'] },
  SEN: { flag: '🇸🇳', colors: ['#00853F', '#FDEF42'] },
  IRQ: { flag: '🇮🇶', colors: ['#CE1126', '#007A3D'] },
  NOR: { flag: '🇳🇴', colors: ['#EF2B2D', '#003087'] },
  // Group J
  ARG: { flag: '🇦🇷', colors: ['#74ACDF', '#FFFFFF'] },
  ALG: { flag: '🇩🇿', colors: ['#006233', '#D21034'] },
  AUT: { flag: '🇦🇹', colors: ['#ED2939', '#FFFFFF'] },
  JOR: { flag: '🇯🇴', colors: ['#007A3D', '#CE1126'] },
  // Group K
  POR: { flag: '🇵🇹', colors: ['#006600', '#FF0000'] },
  UZB: { flag: '🇺🇿', colors: ['#1EB53A', '#CE1126'] },
  COL: { flag: '🇨🇴', colors: ['#FCD116', '#003087'] },
  COD: { flag: '🇨🇩', colors: ['#007FFF', '#F7D618'] },
  // Group L
  ENG: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', colors: ['#CF142B', '#FFFFFF'] },
  CRO: { flag: '🇭🇷', colors: ['#FF0000', '#003DA5'] },
  GHA: { flag: '🇬🇭', colors: ['#006B3F', '#FCD116'] },
  PAN: { flag: '🇵🇦', colors: ['#DA121A', '#003580'] },
}

export function getFlag(code: string): string {
  return TEAM_META[code]?.flag ?? '🏳️'
}

export function getColors(code: string): [string, string] {
  return TEAM_META[code]?.colors ?? ['#6366f1', '#8b5cf6']
}

// Hex → RGB for CSS usage
export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}
