import { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage } from 'electron';
import path from 'node:path';
import { AgentService } from './agent-service.js';
import { WindowManager } from './window-manager.js';
import { TrayManager } from './tray-manager.js';
import { IpcHandler } from './ipc-handler.js';
import { ConfigService } from './config-service.js';

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let windowManager: WindowManager;
let trayManager: TrayManager;
let agentService: AgentService;
let configService: ConfigService;
let ipcHandler: IpcHandler;

const isDev = !app.isPackaged;
const dataDir = path.join(app.getPath('userData'), 'Luma');

async function createWindow(): Promise<void> {
  windowManager = new WindowManager(dataDir);
  mainWindow = windowManager.createMainWindow();

  configService = new ConfigService(dataDir);
  await configService.load();

  agentService = new AgentService(configService, dataDir);
  await agentService.initialize();

  trayManager = new TrayManager(mainWindow);
  tray = trayManager.create();

  ipcHandler = new IpcHandler(agentService, configService, windowManager);
  ipcHandler.register();

  // Global shortcut
  const hotkey = configService.get('general.hotkey') ?? 'Control+Space';
  try {
    globalShortcut.register(hotkey, () => {
      windowManager.toggle();
    });
  } catch (err) {
    console.warn('[Main] Failed to register global shortcut:', err);
  }

  // Handle window close -> minimize to tray
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Load the renderer
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// App ready
app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Before quit
app.on('before-quit', () => {
  (app as Electron.App & { isQuitting: boolean }).isQuitting = true;
  globalShortcut.unregisterAll();
  agentService?.dispose();
  configService?.save();
});
