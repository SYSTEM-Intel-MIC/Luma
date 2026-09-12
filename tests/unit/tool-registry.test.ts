import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '@luma/tools';
import { z } from 'zod';
import { BaseTool } from '@luma/tools';
import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory, PermissionLevel } from '@luma/shared';

class MockTool extends BaseTool {
  get metadata(): ToolMetadata {
    return {
      name: 'mock.tool',
      description: 'A mock tool for testing',
      category: ToolCategory.SYSTEM,
      inputSchema: z.object({ value: z.string() }),
      riskLevel: PermissionLevel.NONE,
      requiresPermission: false,
      supportsRollback: false,
    };
  }

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    return this.success({ echoed: input['value'] }, `Echoed: ${input['value']}`);
  }
}

describe('ToolRegistry', () => {
  it('should register and retrieve tools', () => {
    const registry = new ToolRegistry();
    const tool = new MockTool();
    registry.register(tool);

    expect(registry.get('mock.tool')).toBe(tool);
  });

  it('should list all tools', () => {
    const registry = new ToolRegistry();
    registry.register(new MockTool());

    const list = registry.list();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('mock.tool');
  });

  it('should execute tools', async () => {
    const registry = new ToolRegistry();
    registry.register(new MockTool());

    const result = await registry.execute('mock.tool', { value: 'hello' });
    expect(result.success).toBe(true);
    expect(result.userMessage).toBe('Echoed: hello');
  });

  it('should return error for unknown tools', async () => {
    const registry = new ToolRegistry();
    const result = await registry.execute('unknown.tool', {});
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('TOOL_NOT_FOUND');
  });

  it('should validate tool input', async () => {
    const registry = new ToolRegistry();
    registry.register(new MockTool());

    const result = await registry.execute('mock.tool', { value: 123 });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_INPUT');
  });

  it('should generate tool definitions', () => {
    const registry = new ToolRegistry();
    registry.register(new MockTool());

    const defs = registry.getToolDefinitions();
    expect(defs.length).toBe(1);
    expect(defs[0].type).toBe('function');
    expect(defs[0].function.name).toBe('mock.tool');
  });

  it('should unregister tools', () => {
    const registry = new ToolRegistry();
    registry.register(new MockTool());
    registry.unregister('mock.tool');

    expect(registry.get('mock.tool')).toBeUndefined();
  });
});
