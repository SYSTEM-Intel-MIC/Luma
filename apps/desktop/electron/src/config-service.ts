import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig } from '@luma/shared';
import { DEFAULT_CONFIG } from '@luma/shared';

export class ConfigService {
  private config: AppConfig;
  private configPath: string;

  constructor(dataDir: string) {
    this.configPath = path.join(dataDir, 'config', 'app-config.json');
    this.config = { ...DEFAULT_CONFIG };
    fs.mkdirSync(path.join(dataDir, 'config'), { recursive: true });
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const stored = JSON.parse(data) as Partial<AppConfig>;
        this.config = { ...DEFAULT_CONFIG, ...stored, configVersion: DEFAULT_CONFIG.configVersion };
      }
    } catch (err) {
      console.warn('[Config] Failed to load config, using defaults:', err);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  save(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (err) {
      console.error('[Config] Failed to save config:', err);
    }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K];
  get(key: string): unknown {
    const keys = key.split('.');
    let current: unknown = this.config;
    for (const k of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[k];
    }
    return current;
  }

  set(key: string, value: unknown): void {
    const keys = key.split('.');
    let current: Record<string, unknown> = this.config as unknown as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    this.save();
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.save();
  }
}
