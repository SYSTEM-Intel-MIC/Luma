import BetterSqlite3 from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { sanitizeForLog } from '@luma/shared';

/** Database wrapper for SQLite */
export class Database {
  private db: BetterSqlite3.Database;
  private dbPath: string;

  constructor(dataDir: string) {
    this.dbPath = path.join(dataDir, 'database');
    fs.mkdirSync(this.dbPath, { recursive: true });

    const filePath = path.join(this.dbPath, 'luma.db');
    this.db = new BetterSqlite3(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        agent_state TEXT NOT NULL DEFAULT 'idle',
        result TEXT,
        error TEXT,
        model TEXT,
        duration INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS task_steps (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        detail TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        metadata TEXT,
        timestamp INTEGER NOT NULL,
        duration INTEGER,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS memory (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        source TEXT DEFAULT 'user',
        metadata TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        tool_name TEXT NOT NULL,
        action TEXT NOT NULL,
        scope TEXT NOT NULL,
        level INTEGER NOT NULL,
        decision TEXT NOT NULL,
        scope_type TEXT NOT NULL,
        task_id TEXT,
        reason TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
      CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(category);
      CREATE INDEX IF NOT EXISTS idx_memory_enabled ON memory(enabled);
      CREATE INDEX IF NOT EXISTS idx_history_task_id ON history(task_id);
      CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at);
      CREATE INDEX IF NOT EXISTS idx_permissions_tool_name ON permissions(tool_name);
    `);
  }

  /** Get raw database instance for advanced queries */
  get raw(): BetterSqlite3.Database {
    return this.db;
  }

  /** Run a SQL statement */
  run(sql: string, ...params: unknown[]): BetterSqlite3.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  /** Get a single row */
  get<T>(sql: string, ...params: unknown[]): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /** Get all rows */
  all<T>(sql: string, ...params: unknown[]): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  /** Close database */
  close(): void {
    this.db.close();
  }

  /** Log a safe message (no sensitive data) */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const sanitized = sanitizeForLog(message);
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [Storage] ${sanitized}`);
  }
}
