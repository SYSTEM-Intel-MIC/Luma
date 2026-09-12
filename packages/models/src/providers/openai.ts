import type {
  ChatMessage,
  ModelResponse,
  StreamChunk,
  ModelCapabilities,
  ProviderConfig,
  ToolCallMessage,
} from '@luma/shared';
import { ModelProvider, type ToolDefinition } from '../provider.js';

/** OpenAI model provider */
export class OpenAIProvider extends ModelProvider {
  get name(): string {
    return 'OpenAI';
  }

  get capabilities(): ModelCapabilities {
    return {
      supportsVision: true,
      supportsToolCalling: true,
      supportsReasoning: false,
      supportsStreaming: true,
      supportsEmbeddings: true,
    };
  }

  protected get defaultBaseUrl(): string {
    return 'https://api.openai.com/v1';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const body: Record<string, unknown> = {
      model: this.config.defaultModel ?? 'gpt-4o',
      messages: this.formatMessages(messages),
      temperature: 0.7,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const data = await this.fetchAPI('/chat/completions', body) as OpenAIResponse;
    return this.parseResponse(data);
  }

  async stream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<ModelResponse> {
    const body: Record<string, unknown> = {
      model: this.config.defaultModel ?? 'gpt-4o',
      messages: this.formatMessages(messages),
      temperature: 0.7,
      stream: true,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    return this.streamAPI('/chat/completions', body, onChunk ?? (() => {}));
  }

  protected override parseStreamData(data: Record<string, unknown>): StreamChunk | null {
    const choices = data['choices'] as Array<Record<string, unknown>> | undefined;
    if (!choices || choices.length === 0) return null;

    const delta = choices[0]['delta'] as Record<string, unknown> | undefined;
    if (!delta) return null;

    const content = delta['content'] as string | undefined;
    if (content) {
      return { type: 'text', content };
    }

    const toolCallsRaw = delta['tool_calls'] as Array<Record<string, unknown>> | undefined;
    if (toolCallsRaw && toolCallsRaw.length > 0) {
      const tc = toolCallsRaw[0];
      const fn = tc['function'] as Record<string, unknown> | undefined;
      if (fn) {
        const toolCall: ToolCallMessage = {
          id: (tc['id'] as string) ?? '',
          type: 'function',
          function: {
            name: (fn['name'] as string) ?? '',
            arguments: (fn['arguments'] as string) ?? '',
          },
        };
        return { type: 'tool_call', toolCall };
      }
    }

    return null;
  }

  private formatMessages(messages: ChatMessage[]): unknown[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name ? { name: msg.name } : {}),
      ...(msg.toolCallId ? { tool_call_id: msg.toolCallId } : {}),
      ...(msg.toolCalls ? { tool_calls: msg.toolCalls } : {}),
    }));
  }

  private parseResponse(data: OpenAIResponse): ModelResponse {
    const choice = data.choices?.[0];
    if (!choice) {
      return { content: '', finishReason: 'error' };
    }

    return {
      content: choice.message?.content ?? '',
      toolCalls: choice.message?.tool_calls,
      finishReason: (choice.finish_reason as ModelResponse['finishReason']) ?? 'stop',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: ToolCallMessage[];
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
