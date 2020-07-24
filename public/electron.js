const { spawn } = require('child_process')
const { app, BrowserWindow } = require('electron')
const { registerScheme, createProtocol } = require('./main/protocol')

if (app.isPackaged) {
  process.env.NODE_ENV = 'production'
}
const isDevelopment = process.env.NODE_ENV !== 'production'
let win

if (!isDevelopment) {
  registerScheme('app')
}

function installExtensions() {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch(console.log)
}

async function createWindow() {
  if (isDevelopment) {
    try {
      await installExtensions()
    } catch (e) {
      console.error('Devtools failed to install:', e.toString())
    }

    // react dev server
    await new Promise((resolve, reject) => {
      const server = spawn('npm', ['run', 'dev'])
      const listener = data => {
        if (data.toString().indexOf('Compiled successfully!') !== -1) {
          server.stdout.off('data', listener)
          resolve(true)
        }
      }
      server.stdout.on('data', listener).pipe(process.stdout)
    })
  }

  // Create the browser window.
  win = new BrowserWindow({
    // alwaysOnTop: true,
    width: 1920,
    height: 1080,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
    }
  })
  // 最大化
  win.maximize()

  if (isDevelopment) {
    // Load the url of the dev server if in development mode
    await win.loadURL('http://localhost:3000')
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools()
    }
  } else {
    // Load the index.html when not in development
    createProtocol('app')
    win.loadURL('app://.')
  }

  win.on('closed', () => {
    win = null
  })
}

// Module did not self-register
app.allowRendererProcessReuse = false
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
