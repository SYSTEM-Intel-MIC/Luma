import type { Database } from './database.js';
import type { AppConfig } from '@luma/shared';
import { DEFAULT_CONFIG } from '@luma/shared';

/** Configuration store backed by SQLite */
export class ConfigStore {
  constructor(private db: Database) {}

  /** Get full configuration */
  get(): AppConfig {
    const row = this.db.get<{ value: string }>(
      'SELECT value FROM config WHERE key = ?',
      'app_config'
    );
    if (!row) return { ...DEFAULT_CONFIG };
    try {
      const stored = JSON.parse(row.value) as Partial<AppConfig>;
      return { ...DEFAULT_CONFIG, ...stored, configVersion: DEFAULT_CONFIG.configVersion };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  /** Save full configuration */
  set(config: AppConfig): void {
    const value = JSON.stringify(config);
    this.db.run(
      `INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      'app_config',
      value,
      Date.now()
    );
  }

  /** Get a specific config value by dot-notation key */
  getValue<T>(key: string): T | undefined {
    const config = this.get();
    const keys = key.split('.');
    let current: unknown = config;
    for (const k of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[k];
    }
    return current as T;
  }

  /** Set a specific config value by dot-notation key */
  setValue(key: string, value: unknown): void {
    const config = this.get();
    const keys = key.split('.');
    let current: Record<string, unknown> = config as unknown as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    this.set(config);
  }

  /** Reset configuration to defaults */
  reset(): void {
    this.set({ ...DEFAULT_CONFIG });
  }
}
