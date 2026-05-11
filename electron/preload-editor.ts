import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('editorAPI', {
  onInit: (callback: (data: { text: string; mode: string; memoId?: number; reminderTime?: string }) => void) => {
    ipcRenderer.on('editor-init', (_event, data) => callback(data))
  },
  save: (text: string, mode: string, reminderTime?: string) => {
    ipcRenderer.send('editor-save', text, mode, reminderTime)
  },
  close: () => {
    ipcRenderer.send('editor-close')
  },
  resizeEditor: (w: number, h: number) => {
    ipcRenderer.send('editor-resize', w, h)
  },
  pickImage: () => {
    return ipcRenderer.invoke('pick-image')
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
