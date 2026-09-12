import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron';
import path from 'node:path';

export class TrayManager {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  create(): Tray {
    // Create a simple tray icon (1x1 pixel for now, will be replaced with actual icon)
    const icon = nativeImage.createEmpty();
    const tray = new Tray(icon);

    tray.setToolTip('Luma — Your AI on Windows');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Luma',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: '显示 Luma',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.focus();
        },
      },
      {
        label: '新任务',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.focus();
          this.mainWindow.webContents.send('luma:new-task');
        },
      },
      { type: 'separator' },
      {
        label: '设置',
        click: () => {
          this.mainWindow.show();
          this.mainWindow.focus();
          this.mainWindow.webContents.send('luma:open-settings');
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          (app as Electron.App & { isQuitting: boolean }).isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    return tray;
  }
}
