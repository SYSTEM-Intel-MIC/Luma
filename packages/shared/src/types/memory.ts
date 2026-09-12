/** Memory entry */
export interface MemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  source?: 'user' | 'ai_suggest' | 'automatic';
  metadata?: Record<string, unknown>;
}

/** Memory categories */
export enum MemoryCategory {
  USER_PREFERENCE = 'user_preference',
  PROJECT_INFO = 'project_info',
  WORKFLOW = 'workflow',
  FACT = 'fact',
  RULE = 'rule',
}

/** Memory mode */
export enum MemoryMode {
  MANUAL_ONLY = 'manual_only',
  AI_SUGGEST = 'ai_suggest',
  AUTOMATIC = 'automatic',
}

/** Memory search query */
export interface MemoryQuery {
  text?: string;
  category?: MemoryCategory;
  enabled?: boolean;
  limit?: number;
  offset?: number;
}
