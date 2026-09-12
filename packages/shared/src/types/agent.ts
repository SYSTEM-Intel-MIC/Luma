/** Agent execution states */
export enum AgentState {
  IDLE = 'idle',
  THINKING = 'thinking',
  PLANNING = 'planning',
  WAITING_PERMISSION = 'waiting_permission',
  EXECUTING = 'executing',
  OBSERVING = 'observing',
  VERIFYING = 'verifying',
  WAITING_USER = 'waiting_user',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

/** Permission levels */
export enum PermissionLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

/** Agent configuration */
export interface AgentConfig {
  maxSteps: number;
  maxExecutionTimeMs: number;
  toolTimeoutMs: number;
  retryLimit: number;
  tokenBudget: number;
  autoExecuteLevel: number;
}

/** Default agent configuration */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxSteps: 50,
  maxExecutionTimeMs: 300000,
  toolTimeoutMs: 30000,
  retryLimit: 3,
  tokenBudget: 128000,
  autoExecuteLevel: 1,
};

/** Agent step in execution */
export interface AgentStep {
  id: string;
  taskId: string;
  type: 'thinking' | 'planning' | 'tool_call' | 'observation' | 'verification' | 'user_query' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
  duration?: number;
}
