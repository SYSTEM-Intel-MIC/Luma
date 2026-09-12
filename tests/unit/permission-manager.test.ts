import { describe, it, expect } from 'vitest';
import { PermissionManager } from '@luma/permissions';
import { PermissionDecision, PermissionLevel } from '@luma/shared';

describe('PermissionManager', () => {
  it('should auto-grant LOW risk operations', () => {
    const manager = new PermissionManager(PermissionLevel.LOW);
    const decision = manager.checkPermission('filesystem', 'read', '*', PermissionLevel.LOW);
    expect(decision).toBe(PermissionDecision.GRANTED);
  });

  it('should require approval for HIGH risk operations', () => {
    const manager = new PermissionManager(PermissionLevel.LOW);
    const decision = manager.checkPermission('filesystem', 'delete', '*', PermissionLevel.HIGH);
    expect(decision).toBe(PermissionDecision.PENDING);
  });

  it('should auto-grant NONE risk operations regardless of threshold', () => {
    const manager = new PermissionManager(PermissionLevel.NONE);
    const decision = manager.checkPermission('system', 'info', '*', PermissionLevel.NONE);
    expect(decision).toBe(PermissionDecision.GRANTED);
  });

  it('should respond to pending permission requests', async () => {
    const manager = new PermissionManager(0);
    const request = {
      id: 'test-req-1',
      taskId: 'task-1',
      toolName: 'filesystem',
      action: 'delete',
      description: 'Delete file',
      riskLevel: PermissionLevel.HIGH,
      details: {},
      scope: 'C:\\test',
      reversible: true,
      timestamp: Date.now(),
    };

    const promise = manager.requestPermission(request);

    // Respond after a short delay
    setTimeout(() => {
      manager.respondToPermission('test-req-1', PermissionDecision.GRANTED);
    }, 10);

    const decision = await promise;
    expect(decision).toBe(PermissionDecision.GRANTED);
  });

  it('should handle denied permission', async () => {
    const manager = new PermissionManager(0);
    const request = {
      id: 'test-req-2',
      taskId: 'task-1',
      toolName: 'shell',
      action: 'execute',
      description: 'Execute command',
      riskLevel: PermissionLevel.MEDIUM,
      details: {},
      scope: '*',
      reversible: false,
      timestamp: Date.now(),
    };

    const promise = manager.requestPermission(request);

    setTimeout(() => {
      manager.respondToPermission('test-req-2', PermissionDecision.DENIED);
    }, 10);

    const decision = await promise;
    expect(decision).toBe(PermissionDecision.DENIED);
  });
});
