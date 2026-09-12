import type { MemoryEntry, MemoryQuery } from '@luma/shared';
import { MemoryCategory, MemoryMode } from '@luma/shared';
import { MemoryStore } from '@luma/storage';

/** Memory manager — handles memory lifecycle and context injection */
export class MemoryManager {
  private enabled: boolean;
  private mode: MemoryMode;
  private store: MemoryStore;

  constructor(store: MemoryStore, enabled = true, mode: MemoryMode = MemoryMode.AI_SUGGEST) {
    this.store = store;
    this.enabled = enabled;
    this.mode = mode;
  }

  /** Enable/disable memory */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Set memory mode */
  setMode(mode: MemoryMode): void {
    this.mode = mode;
  }

  /** Get memory mode */
  getMode(): MemoryMode {
    return this.mode;
  }

  /** Is memory enabled */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Add a memory entry from user input */
  async addFromUser(content: string, category: MemoryCategory = MemoryCategory.USER_PREFERENCE): Promise<MemoryEntry | null> {
    if (!this.enabled) return null;
    return this.store.add(content, category, 'user');
  }

  /** Suggest a memory entry (AI suggest mode) */
  async suggestMemory(content: string, category: MemoryCategory = MemoryCategory.FACT): Promise<MemoryEntry | null> {
    if (!this.enabled) return null;
    if (this.mode === MemoryMode.MANUAL_ONLY) return null;
    return this.store.add(content, category, 'ai_suggest');
  }

  /** Auto-store a memory (automatic mode) */
  async autoStore(content: string, category: MemoryCategory = MemoryCategory.FACT): Promise<MemoryEntry | null> {
    if (!this.enabled) return null;
    if (this.mode !== MemoryMode.AUTOMATIC) return null;
    return this.store.add(content, category, 'automatic');
  }

  /** Get relevant memories for context injection */
  async getRelevantMemories(query: string, limit = 10): Promise<MemoryEntry[]> {
    if (!this.enabled) return [];
    const results = this.store.search({
      text: query,
      enabled: true,
      limit,
    });
    return results;
  }

  /** Get all enabled memories for system prompt injection */
  async getContextMemories(): Promise<MemoryEntry[]> {
    if (!this.enabled) return [];
    return this.store.getEnabled(50);
  }

  /** Format memories for system prompt injection */
  formatForPrompt(memories: MemoryEntry[]): string {
    if (memories.length === 0) return '';
    const lines = memories.map((m) => `• ${m.content}`);
    return `用户记忆:\n${lines.join('\n')}`;
  }

  /** Search memories */
  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    return this.store.search(query);
  }

  /** Get all memories */
  async getAll(): Promise<MemoryEntry[]> {
    return this.store.getAll();
  }

  /** Update a memory */
  async update(id: string, content: string): Promise<void> {
    this.store.update(id, content);
  }

  /** Toggle a memory */
  async toggle(id: string, enabled: boolean): Promise<void> {
    this.store.toggle(id, enabled);
  }

  /** Delete a memory */
  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  /** Clear all memories */
  async clear(): Promise<void> {
    this.store.clear();
  }
}
