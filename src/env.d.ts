/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string
  setMinSize: (width: number, height: number) => void
  getMinSize: () => Promise<[number, number]>
  minimizeWindow: () => void
  showContextMenu: (x: number, y: number, data: { time: string; currentColor: string; reminderTime?: string }) => void
  onColorPicked: (callback: (color: string) => void) => void
  openEditor: (text: string, mode?: string, extra?: { memoId?: number; reminderTime?: string }) => void
  onEditorSaved: (callback: (text: string, mode: string, reminderTime?: string) => void) => void
  openSettings: () => void
  fileRead: (key: string) => Promise<any>
  fileWrite: (key: string, data: any) => Promise<void>
  syncReminders: () => Promise<void>
  onReminderFired: (callback: (memoId: number) => void) => void
  broadcastTheme: (themeJson: string) => void
}

interface SettingsAPI {
  close: () => void
  getAutoStart: () => Promise<boolean>
  setAutoStart: (enabled: boolean) => void
  getAppInfo: () => Promise<{
    name: string
    version: string
    electron: string
    chrome: string
    node: string
  }>
  openExternal: (url: string) => void
  onThemeChanged: (callback: (themeJson: string) => void) => void
}

interface EditorAPI {
  onInit: (callback: (data: { text: string; mode: string; memoId?: number; reminderTime?: string }) => void) => void
  save: (text: string, mode: string, reminderTime?: string) => void
  close: () => void
  resizeEditor: (w: number, h: number) => void
  pickImage: () => Promise<string | null>
  onThemeChanged: (callback: (themeJson: string) => void) => void
}

interface LogAPI {
  debug: (source: string, message: string, ...args: any[]) => void
  info: (source: string, message: string, ...args: any[]) => void
  warn: (source: string, message: string, ...args: any[]) => void
  error: (source: string, message: string, ...args: any[]) => void
}

interface Window {
  electronAPI: ElectronAPI
  editorAPI: EditorAPI
  settingsAPI: SettingsAPI
  logAPI: LogAPI
}
