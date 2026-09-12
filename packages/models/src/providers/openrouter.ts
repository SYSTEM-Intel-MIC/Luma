import type { ChatMessage, ModelResponse, StreamChunk, ModelCapabilities } from '@luma/shared';
import { OpenAIProvider } from './openai.js';
import type { ToolDefinition } from '../provider.js';

/** OpenRouter model provider (OpenAI-compatible) */
export class OpenRouterProvider extends OpenAIProvider {
  override get name(): string {
    return 'OpenRouter';
  }

  override get capabilities(): ModelCapabilities {
    return {
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsEmbeddings: false,
    };
  }

  protected override get defaultBaseUrl(): string {
    return 'https://openrouter.ai/api/v1';
  }

  protected override getAuthHeaders(): Record<string, string> {
    return {
      ...super.getAuthHeaders(),
      'HTTP-Referer': 'https://luma.system-intel-mic.dev',
      'X-Title': 'Luma AI Agent',
    };
  }

  override async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const originalModel = this.config.defaultModel;
    this.config.defaultModel = originalModel ?? 'openai/gpt-4o';
    const result = await super.chat(messages, tools);
    if (!originalModel) this.config.defaultModel = originalModel;
    return result;
  }

  override async stream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<ModelResponse> {
    const originalModel = this.config.defaultModel;
    this.config.defaultModel = originalModel ?? 'openai/gpt-4o';
    const result = await super.stream(messages, tools, onChunk);
    if (!originalModel) this.config.defaultModel = originalModel;
    return result;
  }
}
