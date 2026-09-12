import type { z } from 'zod';

/** Tool metadata */
export interface ToolMetadata {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: z.ZodType<unknown>;
  riskLevel: number;
  requiresPermission: boolean;
  supportsRollback: boolean;
}

/** Tool categories */
export enum ToolCategory {
  FILESYSTEM = 'filesystem',
  SHELL = 'shell',
  WINDOWS = 'windows',
  NETWORK = 'network',
  PROCESS = 'process',
  BROWSER = 'browser',
  COMPUTER = 'computer',
  DOCUMENT = 'document',
  SYSTEM = 'system',
}

/** Tool call record */
export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: ToolResult;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  retryCount: number;
}

/** Tool execution result */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: ToolError;
  userMessage: string;
  technicalDetail?: string;
}

/** Tool error */
export interface ToolError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

/** Rollback record */
export interface RollbackRecord {
  toolCallId: string;
  toolName: string;
  beforeState: unknown;
  afterState: unknown;
  rollbackFn: () => Promise<ToolResult>;
}
