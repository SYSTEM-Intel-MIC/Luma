import type { Database } from './database.js';
import type { MemoryEntry, MemoryQuery, MemoryCategory } from '@luma/shared';
import { generateId } from '@luma/shared';

interface MemoryRow {
  id: string;
  content: string;
  category: string;
  enabled: number;
  source: string;
  metadata: string | null;
  created_at: number;
  updated_at: number;
}

/** Memory store backed by SQLite */
export class MemoryStore {
  constructor(private db: Database) {}

  /** Add a memory entry */
  add(content: string, category: MemoryCategory, source: 'user' | 'ai_suggest' | 'automatic' = 'user'): MemoryEntry {
    const id = generateId('mem');
    const now = Date.now();
    this.db.run(
      `INSERT INTO memory (id, content, category, enabled, source, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?, ?)`,
      id, content, category, source, now, now
    );
    return { id, content, category, enabled: true, createdAt: now, updatedAt: now, source };
  }

  /** Get all memory entries */
  getAll(): MemoryEntry[] {
    const rows = this.db.all<MemoryRow>('SELECT * FROM memory ORDER BY created_at DESC');
    return rows.map(this.rowToEntry);
  }

  /** Search memory entries */
  search(query: MemoryQuery): MemoryEntry[] {
    let sql = 'SELECT * FROM memory WHERE 1=1';
    const params: unknown[] = [];

    if (query.text) {
      sql += ' AND content LIKE ?';
      params.push(`%${query.text}%`);
    }
    if (query.category) {
      sql += ' AND category = ?';
      params.push(query.category);
    }
    if (query.enabled !== undefined) {
      sql += ' AND enabled = ?';
      params.push(query.enabled ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }
    if (query.offset) {
      sql += ' OFFSET ?';
      params.push(query.offset);
    }

    const rows = this.db.all<MemoryRow>(sql, ...params);
    return rows.map(this.rowToEntry);
  }

  /** Get a single memory entry */
  get(id: string): MemoryEntry | undefined {
    const row = this.db.get<MemoryRow>('SELECT * FROM memory WHERE id = ?', id);
    return row ? this.rowToEntry(row) : undefined;
  }

  /** Update a memory entry */
  update(id: string, content: string): void {
    this.db.run(
      'UPDATE memory SET content = ?, updated_at = ? WHERE id = ?',
      content, Date.now(), id
    );
  }

  /** Toggle memory entry enabled state */
  toggle(id: string, enabled: boolean): void {
    this.db.run(
      'UPDATE memory SET enabled = ?, updated_at = ? WHERE id = ?',
      enabled ? 1 : 0, Date.now(), id
    );
  }

  /** Delete a memory entry */
  delete(id: string): void {
    this.db.run('DELETE FROM memory WHERE id = ?', id);
  }

  /** Clear all memory */
  clear(): void {
    this.db.run('DELETE FROM memory');
  }

  /** Get enabled memory entries for context injection */
  getEnabled(limit = 50): MemoryEntry[] {
    const rows = this.db.all<MemoryRow>(
      'SELECT * FROM memory WHERE enabled = 1 ORDER BY updated_at DESC LIMIT ?',
      limit
    );
    return rows.map(this.rowToEntry);
  }

  private rowToEntry(row: MemoryRow): MemoryEntry {
    return {
      id: row.id,
      content: row.content,
      category: row.category as MemoryCategory,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: row.source as 'user' | 'ai_suggest' | 'automatic',
      metadata: row.metadata ? JSON.parse(row.metadata) as Record<string, unknown> : undefined,
    };
  }
}
