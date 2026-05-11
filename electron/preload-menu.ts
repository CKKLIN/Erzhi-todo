import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('menuAPI', {
  onData: (callback: (data: any) => void) => {
    ipcRenderer.on('menu-data', (_event, data) => {
      callback(data)
    })
  },
  pickColor: (color: string) => {
    ipcRenderer.send('menu-color-picked', color)
  }
})