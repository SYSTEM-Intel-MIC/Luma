import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private dataDir: string;
  private boundsFile: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.boundsFile = path.join(dataDir, 'config', 'window-bounds.json');
    fs.mkdirSync(path.join(dataDir, 'config'), { recursive: true });
  }

  createMainWindow(): BrowserWindow {
    const bounds = this.loadBounds();
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    this.mainWindow = new BrowserWindow({
      width: bounds.width ?? 480,
      height: bounds.height ?? 360,
      x: bounds.x ?? Math.floor((width - 480) / 2),
      y: bounds.y ?? Math.floor((height - 360) / 2),
      frame: false,
      transparent: true,
      resizable: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Save bounds on move/resize
    this.mainWindow.on('moved', () => this.saveBounds());
    this.mainWindow.on('resized', () => this.saveBounds());

    return this.mainWindow;
  }

  getWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  show(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  hide(): void {
    this.mainWindow?.hide();
  }

  toggle(): void {
    if (this.mainWindow?.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  private saveBounds(): void {
    if (!this.mainWindow) return;
    const bounds = this.mainWindow.getBounds();
    try {
      fs.writeFileSync(this.boundsFile, JSON.stringify(bounds));
    } catch {
      // Ignore write errors
    }
  }

  private loadBounds(): { x?: number; y?: number; width?: number; height?: number } {
    try {
      const data = fs.readFileSync(this.boundsFile, 'utf-8');
      return JSON.parse(data) as { x: number; y: number; width: number; height: number };
    } catch {
      return {};
    }
  }
}
