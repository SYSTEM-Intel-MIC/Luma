import { describe, it, expect } from 'vitest';
import { RiskEngine } from '@luma/permissions';
import { PermissionLevel } from '@luma/shared';

describe('RiskEngine', () => {
  const engine = new RiskEngine();

  it('should rate file read as LOW risk', () => {
    const result = engine.evaluate({
      toolName: 'filesystem',
      action: 'read',
      arguments: { action: 'read', path: 'C:\\Users\\test\\file.txt' },
    });
    expect(result.riskLevel).toBeLessThanOrEqual(PermissionLevel.LOW);
    expect(result.blocked).toBe(false);
  });

  it('should rate file delete as MEDIUM or higher risk', () => {
    const result = engine.evaluate({
      toolName: 'filesystem.delete',
      action: 'delete',
      arguments: { action: 'delete', path: 'C:\\Users\\test\\file.txt' },
      targetPath: 'C:\\Users\\test\\file.txt',
    });
    expect(result.riskLevel).toBeGreaterThanOrEqual(PermissionLevel.MEDIUM);
  });

  it('should block operations on protected directories', () => {
    const result = engine.evaluate({
      toolName: 'filesystem.delete',
      action: 'delete',
      arguments: { action: 'delete', path: 'C:\\Windows\\System32' },
      targetPath: 'C:\\Windows\\System32',
    });
    expect(result.blocked).toBe(true);
    expect(result.riskLevel).toBe(PermissionLevel.CRITICAL);
  });

  it('should block dangerous shell commands', () => {
    const result = engine.evaluate({
      toolName: 'shell.execute',
      action: 'execute',
      arguments: { command: 'format C:' },
    });
    expect(result.blocked).toBe(true);
  });

  it('should rate read-only shell commands as LOW risk', () => {
    const result = engine.evaluate({
      toolName: 'shell.execute',
      action: 'execute',
      arguments: { command: 'Get-Process' },
    });
    expect(result.riskLevel).toBe(PermissionLevel.LOW);
    expect(result.blocked).toBe(false);
  });

  it('should escalate risk for bulk operations', () => {
    const result = engine.evaluate({
      toolName: 'filesystem.delete',
      action: 'delete',
      arguments: { action: 'delete', path: 'C:\\Users\\test\\files' },
      scope: 50,
    });
    expect(result.riskLevel).toBeGreaterThanOrEqual(PermissionLevel.HIGH);
  });

  it('should block shutdown commands', () => {
    const result = engine.evaluate({
      toolName: 'shell.execute',
      action: 'execute',
      arguments: { command: 'shutdown /s /t 0' },
    });
    expect(result.blocked).toBe(true);
  });

  it('should block firewall modification', () => {
    const result = engine.evaluate({
      toolName: 'shell.execute',
      action: 'execute',
      arguments: { command: 'netsh advfirewall set allprofiles state off' },
    });
    expect(result.blocked).toBe(true);
  });

  it('should not block ping command', () => {
    const result = engine.evaluate({
      toolName: 'shell.execute',
      action: 'execute',
      arguments: { command: 'ping google.com' },
    });
    expect(result.blocked).toBe(false);
  });

  it('should rate process kill as HIGH risk', () => {
    const result = engine.evaluate({
      toolName: 'process.kill',
      action: 'kill',
      arguments: { action: 'kill', pid: 1234 },
    });
    expect(result.riskLevel).toBe(PermissionLevel.HIGH);
  });
});
