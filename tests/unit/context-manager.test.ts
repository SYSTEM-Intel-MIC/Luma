import { describe, it, expect } from 'vitest';
import { ContextManager } from '@luma/agent';
import { MessageRole } from '@luma/shared';

describe('ContextManager', () => {
  const manager = new ContextManager();

  it('should estimate tokens roughly correctly', () => {
    const english = 'Hello, this is a test message.';
    const tokens = manager.estimateTokens(english);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(english.length);
  });

  it('should estimate Chinese tokens with higher density', () => {
    const chinese = '你好，这是一条测试消息。';
    const english = 'Hello, this is a test message.';
    const chineseTokens = manager.estimateTokens(chinese);
    const englishTokens = manager.estimateTokens(english);
    // Chinese should use more tokens per character
    expect(chineseTokens / chinese.length).toBeGreaterThan(englishTokens / english.length);
  });

  it('should build context within budget', () => {
    const messages = [
      { role: MessageRole.SYSTEM, content: 'You are Luma.' },
      { role: MessageRole.USER, content: 'Hello' },
      { role: MessageRole.ASSISTANT, content: 'Hi there!' },
    ];

    const result = manager.buildContext(messages, 10000);
    expect(result.length).toBe(messages.length);
    expect(result[0].role).toBe(MessageRole.SYSTEM);
  });

  it('should always include system message', () => {
    const messages = [
      { role: MessageRole.SYSTEM, content: 'System prompt' },
      { role: MessageRole.USER, content: 'A'.repeat(100000) },
    ];

    const result = manager.buildContext(messages, 100);
    expect(result[0].role).toBe(MessageRole.SYSTEM);
  });

  it('should truncate old messages when exceeding budget', () => {
    const messages = [
      { role: MessageRole.SYSTEM, content: 'System' },
    ];

    // Add many messages
    for (let i = 0; i < 100; i++) {
      messages.push({
        role: i % 2 === 0 ? MessageRole.USER : MessageRole.ASSISTANT,
        content: 'A'.repeat(500),
      });
    }

    const result = manager.buildContext(messages, 1000);
    // Should include fewer messages than we put in
    expect(result.length).toBeLessThan(messages.length);
  });
});
