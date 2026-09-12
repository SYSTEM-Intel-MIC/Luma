/** Model provider types */
export enum ModelProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  DEEPSEEK = 'deepseek',
  OPENROUTER = 'openrouter',
  CUSTOM = 'custom',
}

/** Model capabilities */
export interface ModelCapabilities {
  supportsVision: boolean;
  supportsToolCalling: boolean;
  supportsReasoning: boolean;
  supportsStreaming: boolean;
  supportsEmbeddings: boolean;
}

/** Model definition */
export interface ModelDefinition {
  id: string;
  name: string;
  provider: ModelProviderType;
  capabilities: ModelCapabilities;
  contextWindow: number;
  maxOutputTokens: number;
  default: boolean;
}

/** Provider configuration */
export interface ProviderConfig {
  type: ModelProviderType;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  enabled: boolean;
}

/** Chat message roles */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}

/** Chat message */
export interface ChatMessage {
  role: MessageRole;
  content: string | MessageContent[];
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCallMessage[];
}

/** Multi-modal content */
export interface MessageContent {
  type: 'text' | 'image_url' | 'image_base64';
  text?: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}

/** Tool call in message */
export interface ToolCallMessage {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/** Model response */
export interface ModelResponse {
  content: string;
  toolCalls?: ToolCallMessage[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Stream chunk */
export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCallMessage;
  error?: string;
}
