import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory, PermissionLevel } from '@luma/shared';
import os from 'node:os';

const inputSchema = z.object({
  action: z.enum(['hostname', 'user', 'env_path', 'temp_dir', 'home_dir']),
});

/** System utility tool */
export class SystemTool extends BaseTool {
  get metadata(): ToolMetadata {
    return {
      name: 'system',
      description: '系统信息工具：获取主机名、用户、环境路径等。',
      category: ToolCategory.SYSTEM,
      inputSchema,
      riskLevel: PermissionLevel.NONE,
      requiresPermission: false,
      supportsRollback: false,
    };
  }

  async execute(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    switch (input.action) {
      case 'hostname':
        return this.success({ hostname: os.hostname() }, `主机名: ${os.hostname()}`);
      case 'user':
        return this.success(
          { username: os.userInfo().username, homedir: os.userInfo().homedir },
          `用户: ${os.userInfo().username}`,
        );
      case 'env_path':
        return this.success({ path: process.env['PATH'] ?? '' }, '已获取 PATH 环境变量。');
      case 'temp_dir':
        return this.success({ tempDir: os.tmpdir() }, `临时目录: ${os.tmpdir()}`);
      case 'home_dir':
        return this.success({ homeDir: os.homedir() }, `用户目录: ${os.homedir()}`);
      default:
        return this.error('UNKNOWN_ACTION', `Unknown: ${input.action}`, '未知操作。');
    }
  }
}
