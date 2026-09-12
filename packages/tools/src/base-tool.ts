import type { ToolMetadata, ToolResult, ToolCategory } from '@luma/shared';
import type { z } from 'zod';

/** Abstract base class for all tools */
export abstract class BaseTool {
  /** Get tool metadata */
  abstract get metadata(): ToolMetadata;

  /** Execute the tool with validated input */
  abstract execute(input: Record<string, unknown>): Promise<ToolResult>;

  /** Rollback the last operation if supported */
  async rollback(): Promise<ToolResult> {
    return {
      success: false,
      userMessage: '此工具不支持撤销操作。',
      error: {
        code: 'ROLLBACK_NOT_SUPPORTED',
        message: 'Rollback not supported for this tool',
        userMessage: '此工具不支持撤销操作。',
        retryable: false,
      },
    };
  }

  /** Create a success result */
  protected success(data: unknown, userMessage: string, technicalDetail?: string): ToolResult {
    return { success: true, data, userMessage, technicalDetail };
  }

  /** Create an error result */
  protected error(
    code: string,
    message: string,
    userMessage: string,
    retryable = false,
    details?: Record<string, unknown>,
  ): ToolResult {
    return {
      success: false,
      userMessage,
      error: { code, message, userMessage, retryable, details },
    };
  }
}
