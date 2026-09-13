import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron';

// 16x16 purple (#7C3AED) circle tray icon as base64 PNG
const TRAY_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA3ElEQVQ4T6WTsQ3CQBBE3yAh' +
  'IaEDOqAEUgIFUAJdUAIhCZCQkBMfsvlzd7Znr8ST7G/n/8xsPp/vL5L6IaknsG3bNcDX19cL' +
  'QNoBiG8A6dX3fT4CpG0HIL4BpNf3+z4fAdK2AxDfANLr+32fjwBp2wGIbwDp9f2+z0eAtO0A' +
  'xDdAer2+7/MRIG07APEdQLp+3/cjQNp2AOI7gHS93vf5CJC2HYD4DiBdv+/7ESBtOwDxHUC6' +
  '3u77fARI2w5AfAeQrvf7vh8B0rYDEN8BpOvzvh8B0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B' +
  '0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B0rYDEN8B' +
  'pOv7vh8B0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B' +
  '0rYDEN8BpOv7vh8B0rYDEN8BpOv7vh8B0rYD8AcL41mzCZOqwQAAAABJRU5ErkJggg==';

export class TrayManager {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  create(): Tray {
    const icon = nativeImage.createFromDataURL(
      `data:image/png;base64,${TRAY_ICON_BASE64}`,
    );
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
