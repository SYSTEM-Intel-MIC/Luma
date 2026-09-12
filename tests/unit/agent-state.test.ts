import { describe, it, expect } from 'vitest';
import { AgentState, TaskStatus, createTaskId, generateId, formatDuration, formatFileSize, sanitizeForLog } from '@luma/shared';

describe('Agent Types', () => {
  it('should have all agent states', () => {
    expect(AgentState.IDLE).toBe('idle');
    expect(AgentState.THINKING).toBe('thinking');
    expect(AgentState.PLANNING).toBe('planning');
    expect(AgentState.EXECUTING).toBe('executing');
    expect(AgentState.COMPLETED).toBe('completed');
    expect(AgentState.FAILED).toBe('failed');
    expect(AgentState.CANCELLED).toBe('cancelled');
    expect(AgentState.PAUSED).toBe('paused');
  });

  it('should have all task statuses', () => {
    expect(TaskStatus.PENDING).toBe('pending');
    expect(TaskStatus.RUNNING).toBe('running');
    expect(TaskStatus.COMPLETED).toBe('completed');
    expect(TaskStatus.FAILED).toBe('failed');
  });

  it('should create valid task IDs', () => {
    const id = createTaskId();
    expect(id).toMatch(/^task_\d{8}_[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId('test');
    const id2 = generateId('test');
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('test_')).toBe(true);
  });

  it('should format duration correctly', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(5000)).toBe('5.0s');
    expect(formatDuration(90000)).toBe('1m 30s');
    expect(formatDuration(3700000)).toBe('1h 1m');
  });

  it('should format file size correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });

  it('should sanitize API keys from logs', () => {
    expect(sanitizeForLog('sk-abc123def456ghi789jkl012mno345pq')).toContain('[REDACTED_KEY]');
    expect(sanitizeForLog('ghp_abc123def456ghi789jkl012mno345pq')).toContain('[REDACTED_KEY]');
  });

  it('should sanitize passwords from logs', () => {
    const result = sanitizeForLog('password: mysecret123');
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('mysecret123');
  });
});
