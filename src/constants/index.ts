import type { ThemePreset } from '../types'

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const THEME_PRESETS: ThemePreset[] = [
  
  {
    name: '纯白',
    bg: 'rgba(255, 255, 255, 0.95)',
    text: '#1e1e2e',
    muted: '#9ca3af',
    border: 'rgba(0, 0, 0, 0.08)',
    inputBg: 'rgba(0, 0, 0, 0.04)',
    hover: 'rgba(0, 0, 0, 0.03)',
  },
  {
    name: '暗夜紫',
    bg: 'rgba(30, 30, 46, 0.88)',
    text: '#cdd6f4',
    muted: '#585b70',
    border: 'rgba(255, 255, 255, 0.08)',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    hover: 'rgba(255, 255, 255, 0.04)',
  },
  {
    name: '深空蓝',
    bg: 'rgba(17, 24, 39, 0.92)',
    text: '#e2e8f0',
    muted: '#64748b',
    border: 'rgba(255, 255, 255, 0.06)',
    inputBg: 'rgba(255, 255, 255, 0.07)',
    hover: 'rgba(255, 255, 255, 0.04)',
  },
  {
    name: '暖棕',
    bg: 'rgba(41, 37, 36, 0.9)',
    text: '#e7e0d8',
    muted: '#8a7e76',
    border: 'rgba(255, 255, 255, 0.06)',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    hover: 'rgba(255, 255, 255, 0.04)',
  },
  {
    name: '墨绿',
    bg: 'rgba(20, 33, 30, 0.9)',
    text: '#d3e4db',
    muted: '#5e8272',
    border: 'rgba(255, 255, 255, 0.06)',
    inputBg: 'rgba(255, 255, 255, 0.06)',
    hover: 'rgba(255, 255, 255, 0.04)',
  },
]
