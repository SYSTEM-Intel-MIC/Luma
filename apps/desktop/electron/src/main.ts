import { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AgentService } from './agent-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
let isQuitting = false;

const isDev = !app.isPackaged;
const dataDir = path.join(app.getPath('userData'), 'Luma');

async function createWindow(): Promise<void> {
  windowManager = new WindowManager(dataDir);
  mainWindow = windowManager.createMainWindow();

  configService = new ConfigService(dataDir);
  await configService.load();

  try {
    agentService = new AgentService(configService, dataDir);
    await agentService.initialize();
  } catch (err) {
    console.error('[Main] Failed to initialize agent service:', err);
    dialog.showErrorBox(
      'Luma 启动失败',
      `Agent 服务初始化失败：${err instanceof Error ? err.message : String(err)}\n\n应用将以有限模式运行。`,
    );
    agentService = null as unknown as AgentService;
  }

  trayManager = new TrayManager(mainWindow);
  tray = trayManager.create();

  if (agentService) {
    ipcHandler = new IpcHandler(agentService, configService, windowManager);
    ipcHandler.register();
  } else {
    ipcHandler = new IpcHandler(null as unknown as AgentService, configService, windowManager);
    ipcHandler.register();
  }

  // Global shortcut
  const hotkey = configService.getConfig().general.hotkey;
  try {
    globalShortcut.register(hotkey, () => {
      windowManager.toggle();
    });
  } catch (err) {
    console.warn('[Main] Failed to register global shortcut:', err);
  }

  // Handle window close -> minimize to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
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
  try {
    await createWindow();
  } catch (err) {
    console.error('[Main] Failed to create window:', err);
    dialog.showErrorBox(
      'Luma 启动失败',
      `应用初始化失败：${err instanceof Error ? err.message : String(err)}`,
    );
    app.quit();
    return;
  }

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
  isQuitting = true;
  globalShortcut.unregisterAll();
  agentService?.dispose();
  configService?.save();
});
