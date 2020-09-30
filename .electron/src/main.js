import { app, BrowserWindow } from 'electron'

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
  })

  win.loadURL('http://localhost:8080')
}

app.whenReady().then(createWindow)
