import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 设置最小尺寸
  setMinSize: (w: number, h: number) => {
    ipcRenderer.send('set-min-size', w, h)
  },
  // 最小化窗口
  minimizeWindow: () => {
    ipcRenderer.send('minimize-window')
  },
  // 获取最小尺寸
  getMinSize: () => {
    return ipcRenderer.invoke('get-min-size')
  },
  // 显示右键菜单
  showContextMenu: (x: number, y: number, data: any) => {
    ipcRenderer.send('show-context-menu', x, y, data)
  },
  // 监听颜色选择事件
  onColorPicked: (callback: (color: string) => void) => {
    ipcRenderer.on('color-picked', (_event, color) => {
      callback(color)
    })
  },
  // 打开编辑器窗口
  openEditor: (text: string, mode: string = 'memo', extra?: { memoId?: number; reminderTime?: string }) => {
    ipcRenderer.send('open-editor', text, mode, extra)
  },
  // 监听编辑器保存事件
  onEditorSaved: (callback: (text: string, mode: string, reminderTime?: string) => void) => {
    ipcRenderer.on('editor-saved', (_event, text, mode, reminderTime) => {
      callback(text, mode, reminderTime)
    })
  },
  openSettings: () => {
    ipcRenderer.send('open-settings')
  },
  // 文件存储
  fileRead: (key: string) => {
    return ipcRenderer.invoke('file-read', key)
  },
  fileWrite: (key: string, data: any) => {
    return ipcRenderer.invoke('file-write', key, data)
  },
  // 提醒同步
  syncReminders: () => {
    return ipcRenderer.invoke('sync-reminders')
  },
  // 监听提醒触发事件
  onReminderFired: (callback: (memoId: number) => void) => {
    ipcRenderer.on('reminder-fired', (_event, memoId) => {
      callback(memoId)
    })
  },
  // 广播主题变更给其他窗口
  broadcastTheme: (themeJson: string) => {
    ipcRenderer.send('broadcast-theme', themeJson)
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