import { app, BrowserWindow, ipcMain, screen, dialog, nativeImage, shell, Tray, Menu } from 'electron'
import { join, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { initLogger, createLogger } from './logger'

const log = createLogger('main')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let win: BrowserWindow | null = null
let menuWin: BrowserWindow | null = null
let editorWin: BrowserWindow | null = null
let settingsWin: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let minW = 300
let minH = 400

const reminderTimers = new Map<number, NodeJS.Timeout>()

function getBuildDir() {
  // 开发环境：项目根目录下的 build/
  // 打包后：resources/build/（通过 extraResources 打包进去）
  return app.isPackaged
    ? join(process.resourcesPath, 'build')
    : join(__dirname, '..', 'build')
}

function getIcon() {
  const buildDir = getBuildDir()
  if (process.platform === 'win32') {
    const icoPath = join(buildDir, 'icon.ico')
    try {
      if (existsSync(icoPath)) return nativeImage.createFromPath(icoPath)
    } catch { /* ignore */ }
  }
  const pngPath = join(buildDir, 'icon.png')
  try {
    if (existsSync(pngPath)) return nativeImage.createFromPath(pngPath)
  } catch { /* ignore */ }
  return undefined
}

function createWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 520,
    minWidth: minW,
    minHeight: minH,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    icon: getIcon(),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      win?.hide()
      log.info('Window hidden to tray')
    } else {
      if (menuWin && !menuWin.isDestroyed()) { menuWin.destroy(); menuWin = null }
      if (editorWin && !editorWin.isDestroyed()) { editorWin.destroy(); editorWin = null }
      if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.destroy(); settingsWin = null }
      win = null
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    // 开发模式下自动打开控制台（可选）
    // win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function showContextMenu(x: number, y: number, data: { time: string; currentColor: string; reminderTime?: string }) {
  // 如果菜单窗口已存在，先彻底销毁
  if (menuWin) {
    menuWin.destroy()
    menuWin = null
  }

  const menuWidth = 190
  const menuHeight = data.reminderTime ? 185 : 155

  // 计算位置，防止超出屏幕
  const display = screen.getDisplayNearestPoint({ x, y })
  let finalX = x
  let finalY = y

  if (x + menuWidth > display.bounds.x + display.bounds.width) {
    finalX = display.bounds.x + display.bounds.width - menuWidth
  }
  if (y + menuHeight > display.bounds.y + display.bounds.height) {
    finalY = display.bounds.y + display.bounds.height - menuHeight
  }

  menuWin = new BrowserWindow({
    x: finalX,
    y: finalY,
    width: menuWidth,
    height: menuHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: true,
    show: false, // 先不显示，等加载完再显示，防止闪烁
    webPreferences: {
      preload: join(__dirname, 'preload-menu.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 失去焦点时关闭菜单
  menuWin.on('blur', () => {
    if (menuWin) {
      menuWin.close()
      menuWin = null
    }
  })

  menuWin.on('closed', () => {
    menuWin = null
  })

  // 加载菜单页面
  const menuUrl = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}context-menu.html`
    : `file://${join(__dirname, '../dist/context-menu.html')}`

  menuWin.loadURL(menuUrl)

  // 页面加载完成后发送数据并显示
  menuWin.webContents.on('did-finish-load', () => {
    if (menuWin && !menuWin.isDestroyed()) {
      menuWin.webContents.send('menu-data', data)
      menuWin.show()
    }
  })
}

// --- 系统托盘 ---

function ensureMainWindow() {
  if (win && !win.isDestroyed()) {
    win.show()
    win.focus()
    return
  }
  createWindow()
}

function createTray() {
  const iconPath = join(getBuildDir(), 'icon.png')
  let trayIcon: Electron.NativeImage | undefined
  try {
    if (existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 22, height: 22 })
    }
  } catch { /* ignore */ }

  tray = new Tray(trayIcon || nativeImage.createEmpty())
  tray.setToolTip('二支待办')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => ensureMainWindow() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', () => ensureMainWindow())
}

// --- 提醒定时器 ---

function scheduleReminder(memoId: number, reminderTime: string, memoText: string) {
  clearReminder(memoId)

  const target = new Date(reminderTime).getTime()
  const delay = target - Date.now()

  if (delay <= 0) return

  log.info(`Scheduling reminder for memo ${memoId} in ${Math.round(delay / 1000)}s`)

  const timer = setTimeout(() => {
    reminderTimers.delete(memoId)
    showReminderNotification(memoId, memoText)
    clearReminderTimeFromMemo(memoId)
  }, delay)

  reminderTimers.set(memoId, timer)
}

function clearReminder(memoId: number) {
  const existing = reminderTimers.get(memoId)
  if (existing) {
    clearTimeout(existing)
    reminderTimers.delete(memoId)
  }
}

function clearAllReminders() {
  for (const timer of reminderTimers.values()) clearTimeout(timer)
  reminderTimers.clear()
}

function showReminderNotification(memoId: number, text: string) {
  const plainText = text.replace(/<[^>]*>/g, '').slice(0, 200)

  const iconPath = join(getBuildDir(), 'icon.png')
  let iconBase64 = ''
  try {
    if (existsSync(iconPath)) {
      const buf = readFileSync(iconPath)
      const img = nativeImage.createFromBuffer(buf).resize({ width: 40, height: 40 })
      iconBase64 = img.toDataURL()
    }
  } catch { /* ignore */ }

  const notifWin = new BrowserWindow({
    width: 320,
    height: 160,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
    },
  })

  const display = screen.getPrimaryDisplay()
  const db = display.bounds
  const nw = 320, nh = 160
  notifWin.setPosition(db.x + db.width - nw - 12, db.y + db.height - nh - 12)

  const html = `<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; background: rgba(30,30,46,0.96); }
body {
  font-family: -apple-system, 'Microsoft YaHei', sans-serif;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  overflow: hidden;
  user-select: none;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 8px;
}
.title {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: #f9e2af;
}
.app-icon { width: 20px; height: 20px; border-radius: 5px; object-fit: cover; flex-shrink: 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #f9e2af; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.close-btn {
  background: none; border: none; color: #585b70; font-size: 18px;
  cursor: pointer; width: 24px; height: 24px; display: flex;
  align-items: center; justify-content: center; border-radius: 6px;
  transition: all 0.15s;
}
.close-btn:hover { background: rgba(243,139,168,0.2); color: #f38ba8; }
.body { padding: 0 14px 14px; color: #cdd6f4; font-size: 13px; line-height: 1.5;
  overflow: hidden; flex: 1; word-break: break-word; }
</style></head><body>
<div class="header">
  <div class="title">${iconBase64 ? `<img class="app-icon" src="${iconBase64}">` : ''}<span class="dot"></span>备忘录提醒</div>
  <button class="close-btn" id="close">&times;</button>
</div>
<div class="body">${plainText || '(空备忘录)'}</div>
<script>
document.getElementById('close').onclick = () => window.close();
</script></body></html>`

  notifWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  notifWin.webContents.on('did-finish-load', () => {
    if (!notifWin.isDestroyed()) notifWin.show()
  })
  notifWin.on('closed', () => { /* noop */ })
  log.info(`Reminder notification shown for memo ${memoId}`)
}

function clearReminderTimeFromMemo(memoId: number) {
  const dir = getDataDir()
  const filePath = join(dir, 'memos.json')
  try {
    if (!existsSync(filePath)) return
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as any[]
    const memo = data.find((m: any) => m.id === memoId)
    if (memo) {
      memo.reminderTime = undefined
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      log.info(`Cleared reminderTime for memo ${memoId}`)
      if (win && !win.isDestroyed() && win.webContents) {
        win.webContents.send('reminder-fired', memoId)
      }
    }
  } catch (err) {
    log.error(`Failed to clear reminder time for memo ${memoId}:`, err)
  }
}

// 应用准备就绪
app.whenReady().then(() => {
  initLogger()
  log.info('Application started')
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  log.info('All windows closed, app stays in tray')
})

app.on('before-quit', () => {
  isQuitting = true
  clearAllReminders()
  log.info('App quitting')
})

// 渲染进程日志转发
ipcMain.on('log-message', (_e, level: string, source: string, message: string, args: any[]) => {
  const logger = createLogger(source)
  if (level in logger) {
    (logger as any)[level](message, ...args)
  }
})

// --- 文件存储 ---
function getDataDir(): string {
  const devDir = join(__dirname, '..', 'src', 'file')
  const prodDir = join(app.getPath('userData'), 'file')
  return app.isPackaged ? prodDir : devDir
}

ipcMain.handle('file-read', (_e, key: string) => {
  const dir = getDataDir()
  const filePath = join(dir, `${key}.json`)
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    log.error(`Failed to read file ${key}:`, err)
    return null
  }
})

ipcMain.handle('file-write', (_e, key: string, data: any) => {
  const dir = getDataDir()
  mkdirSync(dir, { recursive: true })
  const filePath = join(dir, `${key}.json`)
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    log.debug(`Wrote file ${key}`)
  } catch (err) {
    log.error(`Failed to write file ${key}:`, err)
  }
})

ipcMain.handle('sync-reminders', async () => {
  clearAllReminders()
  const dir = getDataDir()
  const filePath = join(dir, 'memos.json')
  try {
    if (!existsSync(filePath)) return
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as any[]
    let count = 0
    for (const memo of data) {
      if (memo.reminderTime && new Date(memo.reminderTime).getTime() > Date.now()) {
        scheduleReminder(memo.id, memo.reminderTime, memo.text)
        count++
      }
    }
    log.info(`Synced ${count} active reminders`)
  } catch (err) {
    log.error('Failed to sync reminders:', err)
  }
})

// IPC 通信处理
ipcMain.on('minimize-window', () => {
  if (win && !win.isDestroyed()) {
    win.minimize()
    log.debug('Window minimized')
  }
})

ipcMain.on('set-min-size', (_e, w: number, h: number) => {
  minW = w
  minH = h
  if (win && !win.isDestroyed()) {
    win.setMinimumSize(w, h)
    log.info(`Min size set to ${w}x${h}`)
  }
})

ipcMain.handle('get-min-size', () => [minW, minH])

ipcMain.on('show-context-menu', (_e, x: number, y: number, data: { time: string; currentColor: string; reminderTime?: string }) => {
  log.debug(`Context menu requested at (${x}, ${y})`)
  showContextMenu(x, y, data)
})

ipcMain.on('menu-color-picked', (_e, color: string) => {
  log.debug(`Color picked: ${color}`)
  // 增加健壮性检查
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send('color-picked', color)
  }
  
  if (menuWin && !menuWin.isDestroyed()) {
    menuWin.close()
  }
})

ipcMain.on('open-editor', (_e, text: string, mode: string = 'memo', extra?: { memoId?: number; reminderTime?: string }) => {
  if (text === '__close__') {
    if (editorWin && !editorWin.isDestroyed()) editorWin.destroy()
    return
  }
  log.info(`Opening editor window (mode: ${mode})`)
  if (editorWin && !editorWin.isDestroyed()) {
    editorWin.destroy()
  }
  log.info(`Opening editor window (mode: ${mode})`)
  if (editorWin && !editorWin.isDestroyed()) {
    editorWin.destroy()
  }

  const display = screen.getPrimaryDisplay()
  const mainBounds = win && !win.isDestroyed() ? win.getBounds() : null
  const edW = 400
  const edH = 560
  let x: number, y: number

  if (mainBounds) {
    const gap = 12
    const right = mainBounds.x + mainBounds.width + gap
    if (right + edW <= display.bounds.x + display.bounds.width) {
      x = right
      y = mainBounds.y
    } else {
      const left = mainBounds.x - gap - edW
      if (left >= display.bounds.x) {
        x = left
        y = mainBounds.y
      } else {
        x = mainBounds.x
        y = mainBounds.y + mainBounds.height + gap
      }
    }
  } else {
    x = (display.bounds.width - edW) / 2
    y = (display.bounds.height - edH) / 2
  }

  editorWin = new BrowserWindow({
    x: Math.round(x),
    y: Math.round(y),
    width: edW,
    height: edH,
    minWidth: 300,
    minHeight: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload-editor.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  editorWin.on('closed', () => {
    editorWin = null
  })

  const url = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}src/editor/index.html`
    : `file://${join(__dirname, '../dist-editor/index.html')}`

  editorWin.loadURL(url)

  editorWin.webContents.on('did-finish-load', () => {
    if (editorWin && !editorWin.isDestroyed()) {
      editorWin.webContents.send('editor-init', { text, mode, memoId: extra?.memoId, reminderTime: extra?.reminderTime })
      editorWin.show()
    }
  })
})

ipcMain.on('editor-save', (_e, text: string, mode: string = 'memo', reminderTime?: string) => {
  log.info(`Editor content saved (mode: ${mode}, reminder: ${reminderTime || 'none'})`)
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send('editor-saved', text, mode, reminderTime)
  }
})

ipcMain.on('editor-close', () => {
  log.info('Editor window closed')
  if (editorWin && !editorWin.isDestroyed()) {
    editorWin.close()
  }
})

ipcMain.on('editor-resize', (_e, w: number, h: number) => {
  if (editorWin && !editorWin.isDestroyed()) {
    const display = screen.getPrimaryDisplay()
    const bounds = editorWin.getBounds()
    let x = bounds.x
    let y = bounds.y
    if (x + w > display.bounds.x + display.bounds.width) {
      x = display.bounds.x + display.bounds.width - w
    }
    if (y + h > display.bounds.y + display.bounds.height) {
      y = display.bounds.y + display.bounds.height - h
    }
    editorWin.setBounds({ x, y, width: w, height: h })
  }
})

ipcMain.handle('pick-image', async () => {
  log.debug('Opening image picker')
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const fs = await import('fs')
  const data = fs.readFileSync(result.filePaths[0])
  const ext = result.filePaths[0].split('.').pop()?.toLowerCase()
  const mime = ext === 'jpg' ? 'jpeg' : ext
  log.info(`Image picked: ${result.filePaths[0]}`)
  return `data:image/${mime};base64,${data.toString('base64')}`
})

// --- 设置窗口 ---

function showSettingsWindow() {
  log.info('Opening settings window')
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.focus()
    return
  }

  const setW = 420
  const setH = 380
  const display = screen.getPrimaryDisplay()
  const db = display.bounds
  const mainBounds = win && !win.isDestroyed() ? win.getBounds() : null
  const editorBounds = editorWin && !editorWin.isDestroyed() ? editorWin.getBounds() : null

  // 收集已存在窗口的矩形区域
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = []
  if (mainBounds) occupied.push({ x: mainBounds.x, y: mainBounds.y, w: mainBounds.width, h: mainBounds.height })
  if (editorBounds) occupied.push({ x: editorBounds.x, y: editorBounds.y, w: editorBounds.width, h: editorBounds.height })

  // 检测两个矩形是否重叠
  function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  // 检测候选位置是否与任何已存在窗口重叠
  function isOccupied(cx: number, cy: number) {
    return occupied.some(o => overlaps(cx, cy, setW, setH, o.x, o.y, o.w, o.h))
  }

  // 按优先级生成候选位置：右、左、下、上（基于主窗口）
  const candidates: Array<{ x: number; y: number }> = []
  if (mainBounds) {
    const gap = 12
    const cx = mainBounds.x
    const cy = mainBounds.y
    const cw = mainBounds.width
    const ch = mainBounds.height
    // 右侧
    candidates.push({ x: cx + cw + gap, y: cy })
    // 左侧
    candidates.push({ x: cx - gap - setW, y: cy })
    // 下方
    candidates.push({ x: cx, y: cy + ch + gap })
    // 上方
    candidates.push({ x: cx, y: cy - gap - setH })
    // 右下
    candidates.push({ x: cx + cw + gap, y: cy + ch + gap })
    // 左下
    candidates.push({ x: cx - gap - setW, y: cy + ch + gap })
  }

  // 在屏幕内钳制
  function clamp(px: number, py: number) {
    if (px < db.x) px = db.x
    if (py < db.y) py = db.y
    if (px + setW > db.x + db.width) px = db.x + db.width - setW
    if (py + setH > db.y + db.height) py = db.y + db.height - setH
    return { x: px, y: py }
  }

  let chosen = candidates.find(c => {
    const clamped = clamp(c.x, c.y)
    return clamped.x >= db.x && clamped.y >= db.y && !isOccupied(clamped.x, clamped.y)
  })

  let x: number, y: number
  if (chosen) {
    const clamped = clamp(chosen.x, chosen.y)
    x = clamped.x
    y = clamped.y
  } else {
    // 所有候选位置都重叠或越界，居中于屏幕
    x = Math.round((db.width - setW) / 2)
    y = Math.round((db.height - setH) / 2)
  }

  settingsWin = new BrowserWindow({
    x,
    y,
    width: setW,
    height: setH,
    minWidth: 380,
    minHeight: 340,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload-settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  settingsWin.on('closed', () => {
    settingsWin = null
  })

  const url = process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}src/settings/index.html`
    : `file://${join(__dirname, '../dist/src/settings/index.html')}`

  settingsWin.loadURL(url)

  settingsWin.webContents.on('did-finish-load', () => {
    if (settingsWin && !settingsWin.isDestroyed()) {
      settingsWin.show()
    }
  })
}

ipcMain.on('open-settings', () => {
  log.info('Opening settings window')
  showSettingsWindow()
})

ipcMain.on('settings-close', () => {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.close()
    log.info('Settings window closed')
  }
})

ipcMain.handle('get-auto-start', () => {
  return app.getLoginItemSettings().openAtLogin
})

ipcMain.on('set-auto-start', (_e, enabled: boolean) => {
  log.info(`Setting auto-start to ${enabled}`)
  app.setLoginItemSettings({ openAtLogin: enabled })
})

ipcMain.on('open-external', async (_e, url: string) => {
  log.info(`Opening external URL: ${url}`)
  try {
    await shell.openExternal(url)
  } catch (err) {
    log.error(`Failed to open external URL: ${err}`)
  }
})

ipcMain.handle('get-app-info', () => {
  const pkgPath = join(app.getAppPath(), 'package.json')
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return {
      name: '二支待办',
      version: pkg.version || '0.0.0',
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    }
  } catch {
    return {
      name: '二支待办',
      version: '1.0.0',
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    }
  }
})

// 主题广播：主窗口切换主题时通知设置窗口和编辑窗口
ipcMain.on('broadcast-theme', (_e, themeName: string) => {
  log.info(`Broadcasting theme change: ${themeName}`)
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.webContents.send('theme-changed', themeName)
  }
  if (editorWin && !editorWin.isDestroyed()) {
    editorWin.webContents.send('theme-changed', themeName)
  }
})