import type { ChatMessage } from '@luma/shared';
import { MessageRole } from '@luma/shared';

/** Context manager — manages conversation context and token budget */
export class ContextManager {
  private maxContextTokens: number;

  constructor(maxContextTokens = 128000) {
    this.maxContextTokens = maxContextTokens;
  }

  /** Build context messages within token budget */
  buildContext(messages: ChatMessage[], tokenBudget?: number): ChatMessage[] {
    const budget = tokenBudget ?? this.maxContextTokens;
    const result: ChatMessage[] = [];

    // Always include system message
    const systemMsg = messages.find((m) => m.role === MessageRole.SYSTEM);
    if (systemMsg) {
      result.push(systemMsg);
    }

    // Add messages from the end (most recent first) until budget is reached
    const nonSystemMessages = messages.filter((m) => m.role !== MessageRole.SYSTEM);
    let estimatedTokens = this.estimateTokens(this.messageToString(systemMsg));
    const selectedMessages: ChatMessage[] = [];

    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const msg = nonSystemMessages[i];
      const msgTokens = this.estimateTokens(this.messageToString(msg));

      if (estimatedTokens + msgTokens > budget * 0.8) {
        break;
      }

      estimatedTokens += msgTokens;
      selectedMessages.unshift(msg);
    }

    result.push(...selectedMessages);
    return result;
  }

  /** Summarize old messages to compress context */
  summarizeOldMessages(messages: ChatMessage[], keepLast: number): ChatMessage[] {
    if (messages.length <= keepLast + 1) return messages;

    const systemMsg = messages.find((m) => m.role === MessageRole.SYSTEM);
    const oldMessages = messages.filter((m) => m.role !== MessageRole.SYSTEM).slice(0, -keepLast);
    const recentMessages = messages.filter((m) => m.role !== MessageRole.SYSTEM).slice(-keepLast);

    const summary = oldMessages
      .filter((m) => m.role === MessageRole.USER || m.role === MessageRole.ASSISTANT)
      .map((m) => `${m.role}: ${this.messageToString(m).slice(0, 200)}`)
      .join('\n');

    const result: ChatMessage[] = [];
    if (systemMsg) result.push(systemMsg);

    if (summary) {
      result.push({
        role: MessageRole.SYSTEM,
        content: `Previous conversation summary:\n${summary}`,
      });
    }

    result.push(...recentMessages);
    return result;
  }

  /** Estimate token count (rough approximation) */
  estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 2 + otherChars / 4);
  }

  /** Convert message to string for token estimation */
  private messageToString(msg: ChatMessage | undefined): string {
    if (!msg) return '';
    if (typeof msg.content === 'string') return msg.content;
    return JSON.stringify(msg.content);
  }
}
