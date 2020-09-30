import { app, BrowserWindow } from 'electron'
import path from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 100,
    height: 600,
  })

  win.loadURL(path.join(__dirname, '../../index.html'))
}

app.whenReady().then(createWindow)
