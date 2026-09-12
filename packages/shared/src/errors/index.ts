/** Base Luma error */
export class LumaError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(options: {
    code: string;
    message: string;
    userMessage: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = 'LumaError';
    this.code = options.code;
    this.userMessage = options.userMessage;
    this.retryable = options.retryable;
    this.details = options.details;
  }
}

/** Tool execution error */
export class ToolExecutionError extends LumaError {
  public readonly toolName: string;

  constructor(options: {
    code: string;
    message: string;
    userMessage: string;
    retryable: boolean;
    toolName: string;
    details?: Record<string, unknown>;
  }) {
    super({
      ...options,
      details: { ...options.details, toolName: options.toolName },
    });
    this.name = 'ToolExecutionError';
    this.toolName = options.toolName;
  }
}

/** Permission denied error */
export class PermissionDeniedError extends LumaError {
  constructor(toolName: string, action: string, reason?: string) {
    super({
      code: 'PERMISSION_DENIED',
      message: `Permission denied for ${toolName}.${action}`,
      userMessage: '此操作需要你的授权才能执行。',
      retryable: false,
      details: { toolName, action, reason },
    });
    this.name = 'PermissionDeniedError';
  }
}

/** Agent error */
export class AgentError extends LumaError {
  constructor(options: {
    code: string;
    message: string;
    userMessage: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
  }) {
    super({ retryable: false, ...options });
    this.name = 'AgentError';
  }
}

/** Model provider error */
export class ModelProviderError extends LumaError {
  constructor(options: {
    code: string;
    message: string;
    provider: string;
    retryable?: boolean;
    statusCode?: number;
  }) {
    super({
      code: options.code,
      message: options.message,
      userMessage: '模型服务暂时不可用，请稍后重试。',
      retryable: options.retryable ?? true,
      details: { provider: options.provider, statusCode: options.statusCode },
    });
    this.name = 'ModelProviderError';
  }
}

/** Configuration error */
export class ConfigError extends LumaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      code: 'CONFIG_ERROR',
      message,
      userMessage: '配置出现问题，请检查设置。',
      retryable: false,
      details,
    });
    this.name = 'ConfigError';
  }
}

/** Error code constants */
export const ErrorCodes = {
  TOOL_TIMEOUT: 'TOOL_TIMEOUT',
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  TOOL_EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_LOCKED: 'FILE_LOCKED',
  FILE_PERMISSION: 'FILE_PERMISSION',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  AGENT_MAX_STEPS: 'AGENT_MAX_STEPS',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  AGENT_LOOP_DETECTED: 'AGENT_LOOP_DETECTED',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  MODEL_RATE_LIMIT: 'MODEL_RATE_LIMIT',
  MODEL_CONTEXT_LENGTH: 'MODEL_CONTEXT_LENGTH',
  CONFIG_INVALID: 'CONFIG_INVALID',
  STORAGE_ERROR: 'STORAGE_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;
