import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory } from '@luma/shared';
import { BaseTool } from './base-tool.js';
import type { z } from 'zod';

/** Tool registry — manages all available tools */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  /** Register a tool */
  register(tool: BaseTool): void {
    const name = tool.metadata.name;
    if (this.tools.has(name)) {
      console.warn(`[ToolRegistry] Tool already registered: ${name}, overwriting.`);
    }
    this.tools.set(name, tool);
  }

  /** Unregister a tool */
  unregister(name: string): void {
    this.tools.delete(name);
  }

  /** Get a tool by name */
  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  /** List all registered tools */
  list(): ToolMetadata[] {
    return Array.from(this.tools.values()).map((t) => t.metadata);
  }

  /** List tools by category */
  listByCategory(category: ToolCategory): ToolMetadata[] {
    return this.list().filter((t) => t.category === category);
  }

  /** Execute a tool by name */
  async execute(name: string, input: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        userMessage: `未找到工具: ${name}`,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool not found: ${name}`,
          userMessage: `未找到工具: ${name}`,
          retryable: false,
        },
      };
    }

    // Validate input
    const parseResult = tool.metadata.inputSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        userMessage: '工具输入参数无效。',
        error: {
          code: 'INVALID_INPUT',
          message: `Validation failed: ${parseResult.error.message}`,
          userMessage: '工具输入参数无效。',
          retryable: false,
          details: { errors: parseResult.error.issues },
        },
      };
    }

    try {
      return await tool.execute(parseResult.data as Record<string, unknown>);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        userMessage: `工具执行出错: ${name}`,
        error: {
          code: 'TOOL_EXECUTION_FAILED',
          message,
          userMessage: `工具 ${name} 执行失败，请稍后重试。`,
          retryable: true,
          details: { toolName: name },
        },
      };
    }
  }

  /** Get tool definitions for model function calling */
  getToolDefinitions(): Array<{
    type: 'function';
    function: { name: string; description: string; parameters: Record<string, unknown> };
  }> {
    return this.list().map((meta) => ({
      type: 'function' as const,
      function: {
        name: meta.name,
        description: meta.description,
        parameters: this.zodToJsonSchema(meta.inputSchema),
      },
    }));
  }

  /** Convert Zod schema to JSON Schema (simplified) */
  private zodToJsonSchema(schema: z.ZodType<unknown>): Record<string, unknown> {
    // Use a simplified approach - extract shape from ZodObject
    try {
      const shapeResult = (schema as z.ZodObject<z.ZodRawShape>).shape;
      if (shapeResult && typeof shapeResult === 'object') {
        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        for (const [key, value] of Object.entries(shapeResult)) {
          properties[key] = this.zodFieldToJson(value as z.ZodType<unknown>);
          if (!(value as z.ZodType<unknown>).isOptional()) {
            required.push(key);
          }
        }

        return {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        };
      }
    } catch {
      // Fallback
    }

    return { type: 'object', properties: {} };
  }

  private zodFieldToJson(schema: z.ZodType<unknown>): Record<string, unknown> {
    // Simplified JSON schema generation from Zod types
    const desc = schema.description;
    const result: Record<string, unknown> = {};
    if (desc) result.description = desc;

    // Check if it's optional and unwrap
    const isOptional = schema.isOptional();
    const unwrapped = isOptional ? (schema as z.ZodOptional<z.ZodType<unknown>>).unwrap() : schema;

    // Determine type by checking methods/properties
    const def = unwrapped._def as Record<string, unknown>;
    const typeName = def?.typeName as string | undefined;

    switch (typeName) {
      case 'ZodString':
        return { ...result, type: 'string' };
      case 'ZodNumber':
        return { ...result, type: 'number' };
      case 'ZodBoolean':
        return { ...result, type: 'boolean' };
      case 'ZodArray': {
        const itemType = def?.type as z.ZodType<unknown> | undefined;
        return {
          ...result,
          type: 'array',
          items: itemType ? this.zodFieldToJson(itemType) : {},
        };
      }
      case 'ZodEnum': {
        const values = def?.values as string[] | undefined;
        return { ...result, type: 'string', enum: values };
      }
      default:
        return { ...result, type: 'string' };
    }
  }
}
