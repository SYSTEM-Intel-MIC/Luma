import type { Database } from './database.js';
import { generateId } from '@luma/shared';

interface HistoryEntry {
  id: string;
  taskId: string | null;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

interface HistoryRow {
  id: string;
  task_id: string | null;
  role: string;
  content: string;
  metadata: string | null;
  created_at: number;
}

/** History store backed by SQLite */
export class HistoryStore {
  constructor(private db: Database) {}

  /** Add a history entry */
  add(taskId: string | null, role: HistoryEntry['role'], content: string, metadata?: Record<string, unknown>): HistoryEntry {
    const id = generateId('hist');
    const now = Date.now();
    this.db.run(
      `INSERT INTO history (id, task_id, role, content, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id, taskId, role, content,
      metadata ? JSON.stringify(metadata) : null, now
    );
    return { id, taskId, role, content, metadata, createdAt: now };
  }

  /** Get history for a task */
  getByTask(taskId: string): HistoryEntry[] {
    const rows = this.db.all<HistoryRow>(
      'SELECT * FROM history WHERE task_id = ? ORDER BY created_at ASC',
      taskId
    );
    return rows.map(this.rowToEntry);
  }

  /** Get recent history */
  getRecent(limit = 100): HistoryEntry[] {
    const rows = this.db.all<HistoryRow>(
      'SELECT * FROM history ORDER BY created_at DESC LIMIT ?',
      limit
    );
    return rows.map(this.rowToEntry).reverse();
  }

  /** Clear old history beyond retention */
  clearOld(retentionDays: number): number {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const result = this.db.run('DELETE FROM history WHERE created_at < ?', cutoff);
    return result.changes;
  }

  /** Clear all history */
  clearAll(): void {
    this.db.run('DELETE FROM history');
  }

  private rowToEntry(row: HistoryRow): HistoryEntry {
    return {
      id: row.id,
      taskId: row.task_id,
      role: row.role as HistoryEntry['role'],
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) as Record<string, unknown> : undefined,
      createdAt: row.created_at,
    };
  }
}
