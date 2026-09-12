import type {
  ChatMessage,
  ModelResponse,
  StreamChunk,
  ModelCapabilities,
} from '@luma/shared';
import { ModelProvider, type ToolDefinition } from '../provider.js';

/** Google Gemini model provider */
export class GoogleProvider extends ModelProvider {
  get name(): string {
    return 'Google Gemini';
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
    return 'https://generativelanguage.googleapis.com/v1beta';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {};
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const model = this.config.defaultModel ?? 'gemini-2.0-flash';
    const endpoint = `/models/${model}:generateContent?key=${this.config.apiKey}`;

    const body = this.formatRequest(messages, tools);
    const data = await this.fetchAPI(endpoint, body) as GoogleResponse;
    return this.parseResponse(data);
  }

  async stream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<ModelResponse> {
    const model = this.config.defaultModel ?? 'gemini-2.0-flash';
    const endpoint = `/models/${model}:streamGenerateContent?key=${this.config.apiKey}`;

    const body = this.formatRequest(messages, tools);
    return this.streamAPI(endpoint, body, onChunk ?? (() => {}));
  }

  protected override parseStreamData(data: Record<string, unknown>): StreamChunk | null {
    const candidates = data['candidates'] as Array<Record<string, unknown>> | undefined;
    if (!candidates?.[0]) return null;

    const content = candidates[0]['content'] as Record<string, unknown> | undefined;
    const parts = content?.['parts'] as Array<Record<string, unknown>> | undefined;
    if (!parts?.[0]) return null;

    const text = parts[0]['text'] as string | undefined;
    if (text) return { type: 'text', content: text };

    return null;
  }

  private formatRequest(messages: ChatMessage[], tools?: ToolDefinition[]): Record<string, unknown> {
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
      }));

    const body: Record<string, unknown> = { contents };

    const systemMsg = messages.find((m) => m.role === 'system');
    if (systemMsg) {
      body.systemInstruction = {
        parts: [{ text: typeof systemMsg.content === 'string' ? systemMsg.content : '' }],
      };
    }

    if (tools && tools.length > 0) {
      body.tools = [{
        functionDeclarations: tools.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        })),
      }];
    }

    return body;
  }

  private parseResponse(data: GoogleResponse): ModelResponse {
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? '').join('');
    const functionCalls = parts.filter((p) => p.functionCall);

    const toolCalls = functionCalls.map((p) => ({
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'function' as const,
      function: {
        name: p.functionCall?.name ?? '',
        arguments: JSON.stringify(p.functionCall?.args ?? {}),
      },
    }));

    return {
      content: text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: functionCalls.length > 0 ? 'tool_calls' : 'stop',
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount ?? 0,
            completionTokens: data.usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: data.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
    };
  }
}

interface GoogleResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        functionCall?: { name: string; args: Record<string, unknown> };
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}
