import type {
  ChatMessage,
  ModelResponse,
  StreamChunk,
  ModelCapabilities,
  ToolCallMessage,
} from '@luma/shared';
import { ModelProvider, type ToolDefinition } from '../provider.js';

/** Anthropic model provider */
export class AnthropicProvider extends ModelProvider {
  get name(): string {
    return 'Anthropic';
  }

  get capabilities(): ModelCapabilities {
    return {
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      supportsStreaming: true,
      supportsEmbeddings: false,
    };
  }

  protected get defaultBaseUrl(): string {
    return 'https://api.anthropic.com/v1';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const { system, conversation } = this.formatMessages(messages);
    const body: Record<string, unknown> = {
      model: this.config.defaultModel ?? 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: conversation,
    };

    if (system) body.system = system;
    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    const data = await this.fetchAPI('/messages', body) as AnthropicResponse;
    return this.parseResponse(data);
  }

  async stream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<ModelResponse> {
    const { system, conversation } = this.formatMessages(messages);
    const body: Record<string, unknown> = {
      model: this.config.defaultModel ?? 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: conversation,
      stream: true,
    };

    if (system) body.system = system;
    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    return this.streamAPI('/messages', body, onChunk ?? (() => {}));
  }

  protected override parseStreamData(data: Record<string, unknown>): StreamChunk | null {
    const type = data['type'] as string;
    if (type === 'content_block_delta') {
      const delta = data['delta'] as Record<string, unknown> | undefined;
      if (delta?.['type'] === 'text_delta') {
        return { type: 'text', content: delta['text'] as string };
      }
    }
    if (type === 'message_stop') {
      return { type: 'done' };
    }
    return null;
  }

  private formatMessages(messages: ChatMessage[]): { system?: string; conversation: unknown[] } {
    let system: string | undefined;
    const conversation: unknown[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = typeof msg.content === 'string' ? msg.content : '';
        continue;
      }
      conversation.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    return { system, conversation };
  }

  private parseResponse(data: AnthropicResponse): ModelResponse {
    const content = data.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('') ?? '';

    const toolCalls: ToolCallMessage[] = data.content
      ?.filter((b) => b.type === 'tool_use')
      .map((b) => ({
        id: b.id ?? '',
        type: 'function' as const,
        function: {
          name: b.name ?? '',
          arguments: JSON.stringify(b.input ?? {}),
        },
      })) ?? [];

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }
}

interface AnthropicResponse {
  content?: Array<{
    type: string;
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  stop_reason?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
