import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('settingsAPI', {
  close: () => {
    ipcRenderer.send('settings-close')
  },
  getAutoStart: () => {
    return ipcRenderer.invoke('get-auto-start')
  },
  setAutoStart: (enabled: boolean) => {
    ipcRenderer.send('set-auto-start', enabled)
  },
  getAppInfo: () => {
    return ipcRenderer.invoke('get-app-info')
  },
  openExternal: (url: string) => {
    ipcRenderer.send('open-external', url)
  },
  onThemeChanged: (callback: (themeJson: string) => void) => {
    ipcRenderer.on('theme-changed', (_event, themeJson) => callback(themeJson))
  },
})

contextBridge.exposeInMainWorld('logAPI', {
  debug: (source: string, message: string, ...args: any[]) => {
    ipcRenderer.send('log-message', 'debug', source, message, args)
  },
  info: (source: string, message: string, ...args: any[]) => {
    ipcRenderer.send('log-message', 'info', source, message, args)
  },
  warn: (source: string, message: string, ...args: any[]) => {
    ipcRenderer.send('log-message', 'warn', source, message, args)
  },
  error: (source: string, message: string, ...args: any[]) => {
    ipcRenderer.send('log-message', 'error', source, message, args)
  },
})
