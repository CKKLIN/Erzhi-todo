import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// Fix: vite-plugin-electron@0.29.x treeKillSync crashes when the process is already dead on Windows
const _cp = require('child_process')
const _origExecSync = _cp.execSync
_cp.execSync = (command: string, options?: any) => {
  const opts = { ...options, stdio: ['pipe', 'pipe', 'ignore'] }
  try {
    return _origExecSync(command, opts)
  } catch (err: any) {
    if (process.platform === 'win32' && command.startsWith('taskkill') && err.status === 128) {
      return Buffer.alloc(0)
    }
    throw err
  }
}

const isElectron = process.env.TARGET !== 'mobile'

export default defineConfig(async () => {
  const plugins: any[] = [vue()]

  if (isElectron) {
    const electron = (await import('vite-plugin-electron')).default
    const renderer = (await import('vite-plugin-electron-renderer')).default
    plugins.push(
      electron([
        { entry: 'electron/main.ts' },
        {
          entry: 'electron/preload.ts',
          vite: {
            build: {
              lib: { entry: 'electron/preload.ts', formats: ['cjs'] },
              rollupOptions: { external: ['electron'] },
            },
          },
        },
        {
          entry: 'electron/preload-menu.ts',
          vite: {
            build: {
              lib: { entry: 'electron/preload-menu.ts', formats: ['cjs'] },
              rollupOptions: { external: ['electron'] },
            },
          },
        },
        {
          entry: 'electron/preload-editor.ts',
          vite: {
            build: {
              lib: { entry: 'electron/preload-editor.ts', formats: ['cjs'] },
              rollupOptions: { external: ['electron'] },
            },
          },
        },
        {
          entry: 'electron/preload-settings.ts',
          vite: {
            build: {
              lib: { entry: 'electron/preload-settings.ts', formats: ['cjs'] },
              rollupOptions: { external: ['electron'] },
            },
          },
        },
      ]),
      renderer(),
    )
  }

  return {
    server: {
      port: 5100,
    },
    plugins,
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          editor: resolve(__dirname, 'src/editor/index.html'),
          settings: resolve(__dirname, 'src/settings/index.html'),
        },
      },
    },
  }
})
