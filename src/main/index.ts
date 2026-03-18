import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { optimizer, is } from '@electron-toolkit/utils';
import { LifecycleManager } from './core/LifecycleManager';
import { IpcBridge } from './core/IpcBridge';

let mainWindow: BrowserWindow;
let lifecycleManager: LifecycleManager;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    require('electron').shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Bootstrapping
app.whenReady().then(async () => {
  // Set app user model id for windows
  app.setAppUserModelId('com.electron.teif');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Start architecture dependencies
  const bridge = new IpcBridge();
  lifecycleManager = new LifecycleManager(bridge);

  createWindow();

  // Give the bridge awareness of the newly created window so that IPC relay works
  bridge.setWindow(mainWindow);

  // Initialize the core + plugins
  await lifecycleManager.bootstrap();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  await lifecycleManager.shutdown();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
