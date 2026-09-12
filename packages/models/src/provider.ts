import type {
  ChatMessage,
  ModelResponse,
  StreamChunk,
  ToolCallMessage,
  ModelCapabilities,
  ProviderConfig,
} from '@luma/shared';
import { ModelProviderError } from '@luma/shared';

/** Abstract model provider interface */
export abstract class ModelProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /** Provider display name */
  abstract get name(): string;

  /** Provider capabilities */
  abstract get capabilities(): ModelCapabilities;

  /** Send a chat completion request */
  abstract chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ModelResponse>;

  /** Stream a chat completion */
  abstract stream(
    messages: ChatMessage[],
    tools: ToolDefinition[] | undefined,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ModelResponse>;

  /** Check if provider is configured and ready */
  isReady(): boolean {
    return !!this.config.apiKey && this.config.enabled;
  }

  /** Get the base URL for API calls */
  protected get baseUrl(): string {
    return this.config.baseUrl ?? this.defaultBaseUrl;
  }

  /** Default base URL for this provider */
  protected abstract get defaultBaseUrl(): string;

  /** Make an HTTP request to the provider API */
  protected async fetchAPI(
    endpoint: string,
    body: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new ModelProviderError({
        code: `HTTP_${response.status}`,
        message: `API request failed: ${response.status} - ${errorText}`,
        provider: this.name,
        retryable: response.status >= 500 || response.status === 429,
        statusCode: response.status,
      });
    }

    return response.json();
  }

  /** Get authentication headers */
  protected abstract getAuthHeaders(): Record<string, string>;

  /** Stream response from API */
  protected async streamAPI(
    endpoint: string,
    body: Record<string, unknown>,
    onChunk: (chunk: StreamChunk) => void,
    headers?: Record<string, string>,
  ): Promise<ModelResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...headers,
      },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new ModelProviderError({
        code: `HTTP_${response.status}`,
        message: `Stream request failed: ${response.status} - ${errorText}`,
        provider: this.name,
        retryable: response.status >= 500 || response.status === 429,
        statusCode: response.status,
      });
    }

    return this.parseStream(response, onChunk);
  }

  /** Parse SSE stream — to be overridden by providers */
  protected async parseStream(
    response: Response,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ModelResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new ModelProviderError({
        code: 'NO_STREAM_BODY',
        message: 'Response has no body for streaming',
        provider: this.name,
      });
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    const toolCalls: ToolCallMessage[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(trimmed.slice(6)) as Record<string, unknown>;
          const parsed = this.parseStreamData(data);
          if (parsed) {
            if (parsed.type === 'text' && parsed.content) {
              fullContent += parsed.content;
              onChunk(parsed);
            } else if (parsed.type === 'tool_call' && parsed.toolCall) {
              toolCalls.push(parsed.toolCall);
              onChunk(parsed);
            } else if (parsed.type === 'done') {
              onChunk(parsed);
            }
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }

    onChunk({ type: 'done' });

    return {
      content: fullContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
    };
  }

  /** Parse a single stream data chunk — override in providers */
  protected parseStreamData(
    _data: Record<string, unknown>,
  ): StreamChunk | null {
    return null;
  }
}

/** Tool definition for model function calling */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
