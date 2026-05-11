import { ref } from 'vue'
import type { ThemePreset } from '../types'
import { THEME_PRESETS } from '../constants'
import { useLogger } from './useLogger'

const SETTINGS_KEY = 'memo-settings'

export function useSettings() {
  const log = useLogger('useSettings')
  const theme = ref<ThemePreset>(THEME_PRESETS[0])
  const minW = ref(300)
  const minH = ref(400)

  function load() {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      try {
        const s = JSON.parse(saved)
        theme.value = s.themeData ?? THEME_PRESETS.find((t) => t.name === s.themeName) ?? THEME_PRESETS[0]
        minW.value = s.minW ?? 300
        minH.value = s.minH ?? 400
      } catch { log.error('Failed to parse settings from storage') }
    }

    window.electronAPI?.getMinSize().then(([w, h]) => {
      minW.value = w
      minH.value = h
    }).catch(() => {})
    log.info('Settings loaded')
  }

  function save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      themeName: theme.value.name,
      themeData: theme.value,
      minW: minW.value,
      minH: minH.value,
    }))
    window.electronAPI?.setMinSize(minW.value, minH.value)
    window.electronAPI?.broadcastTheme(JSON.stringify(theme.value))
    log.info(`Settings saved: theme=${theme.value.name}, minW=${minW.value}, minH=${minH.value}`)
  }

  return { theme, minW, minH, load, save }
}
