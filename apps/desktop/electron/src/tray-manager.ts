import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

function createTrayIcon(): Electron.NativeImage {
  const iconPath = path.join(
    app.getPath('userData'),
    'Luma',
    'tray-icon.png',
  );

  if (fs.existsSync(iconPath)) {
    try {
      return nativeImage.createFromPath(iconPath);
    } catch {
      // Fall through to generate
    }
  }

  // Generate a 16x16 purple (#7C3AED) tray icon as PNG
  // Minimal valid 16x16 8-bit RGB PNG
  const width = 16;
  const height = 16;

  // Build raw pixel data (filter byte + RGB for each row)
  const rawRows: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [0]; // filter: none
    for (let x = 0; x < width; x++) {
      // Rounded rectangle: purple with slight transparency at edges
      const cx = width / 2;
      const cy = height / 2;
      const rx = width / 2 - 1;
      const ry = height / 2 - 1;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = dx * dx + dy * dy;
      if (dist <= 1.0) {
        row.push(124, 58, 237); // #7C3AED
      } else {
        row.push(0, 0, 0); // transparent (black, will be invisible)
      }
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows.map((r) => Buffer.from(r)));

  // Deflate the raw data using Node.js zlib
  const { deflateSync } = require('node:zlib') as typeof import('node:zlib');
  const compressed = deflateSync(rawData);

  // Build PNG
  const crcTable = buildCRC32Table();
  const chunks: Buffer[] = [];

  // PNG signature
  chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  chunks.push(makeChunk('IHDR', ihdrData, crcTable));

  // IDAT
  chunks.push(makeChunk('IDAT', compressed, crcTable));

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0), crcTable));

  const pngBuffer = Buffer.concat(chunks);

  // Save for future use
  try {
    const dir = path.dirname(iconPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(iconPath, pngBuffer);
  } catch {
    // Ignore save errors
  }

  return nativeImage.createFromBuffer(pngBuffer);
}

function makeChunk(
  type: string,
  data: Buffer,
  crcTable: number[],
): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcValue = crc32(crcInput, crcTable);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcValue >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuf]);
}

function buildCRC32Table(): number[] {
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

function crc32(buf: Buffer, table: number[]): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export class TrayManager {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  create(): Tray {
    const icon = createTrayIcon();
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
