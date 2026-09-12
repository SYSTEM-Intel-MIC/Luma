import type { AgentState } from './agent.js';
import type { ToolCall } from './tool.js';

/** Task status */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  WAITING_PERMISSION = 'waiting_permission',
  WAITING_USER = 'waiting_user',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/** A user task */
export interface Task {
  id: string;
  userPrompt: string;
  status: TaskStatus;
  agentState: AgentState;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  steps: TaskStep[];
  toolCalls: ToolCall[];
  permissions: PermissionRecord[];
  result?: string;
  error?: string;
  duration?: number;
  model?: string;
}

/** A step within a task */
export interface TaskStep {
  taskId: string;
  id: string;
  type: 'thinking' | 'planning' | 'tool_call' | 'observation' | 'verification' | 'user_query' | 'error' | 'permission_request';
  title: string;
  detail?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/** Permission record for a task */
export interface PermissionRecord {
  id: string;
  toolName: string;
  action: string;
  scope: string;
  level: number;
  decision: 'pending' | 'granted' | 'denied';
  reason?: string;
  timestamp: number;
  expiresAt?: number;
}

/** Create a new task ID */
export function createTaskId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `task_${dateStr}_${random}`;
}
