import type { ChatMessage, ModelResponse, StreamChunk, ModelCapabilities } from '@luma/shared';
import { OpenAIProvider } from './openai.js';
import type { ToolDefinition } from '../provider.js';

/** DeepSeek model provider (OpenAI-compatible) */
export class DeepSeekProvider extends OpenAIProvider {
  override get name(): string {
    return 'DeepSeek';
  }

  override get capabilities(): ModelCapabilities {
    return {
      supportsVision: false,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsEmbeddings: false,
    };
  }

  protected override get defaultBaseUrl(): string {
    return 'https://api.deepseek.com/v1';
  }

  override async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const originalModel = this.config.defaultModel;
    this.config.defaultModel = originalModel ?? 'deepseek-chat';
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
    this.config.defaultModel = originalModel ?? 'deepseek-chat';
    const result = await super.stream(messages, tools, onChunk);
    if (!originalModel) this.config.defaultModel = originalModel;
    return result;
  }
}
