import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory, PermissionLevel } from '@luma/shared';
import { exec } from 'node:child_process';

const inputSchema = z.object({
  action: z.enum(['list', 'info', 'kill']),
  pid: z.number().optional().describe('进程 ID'),
  name: z.string().optional().describe('进程名称过滤'),
  force: z.boolean().optional().default(false).describe('是否强制结束'),
});

/** Process management tool */
export class ProcessTool extends BaseTool {
  get metadata(): ToolMetadata {
    return {
      name: 'process',
      description: '进程管理工具：查看进程列表、进程信息、结束进程。',
      category: ToolCategory.PROCESS,
      inputSchema,
      riskLevel: PermissionLevel.MEDIUM,
      requiresPermission: true,
      supportsRollback: false,
    };
  }

  async execute(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    switch (input.action) {
      case 'list':
        return this.listProcesses(input.name);
      case 'info':
        return this.processInfo(input.pid);
      case 'kill':
        return this.killProcess(input.pid, input.force ?? false);
      default:
        return this.error('UNKNOWN_ACTION', `Unknown: ${input.action}`, '未知操作。');
    }
  }

  private listProcesses(nameFilter?: string): Promise<ToolResult> {
    const cmd = process.platform === 'win32'
      ? 'powershell.exe -NoProfile -Command "Get-Process | Select-Object Id, ProcessName, CPU, WorkingSet | ConvertTo-Json"'
      : 'ps aux --sort=-%mem | head -50';

    return new Promise((resolve) => {
      exec(cmd, { timeout: 15000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout) => {
        if (error) {
          resolve(this.error('PROCESS_LIST_FAILED', error.message, '无法获取进程列表。', true));
          return;
        }

        let output = stdout?.toString() ?? '';
        if (nameFilter) {
          const lower = nameFilter.toLowerCase();
          output = output.split('\n').filter((line) => line.toLowerCase().includes(lower)).join('\n');
        }

        resolve(this.success({ output }, '已获取进程列表。'));
      });
    });
  }

  private processInfo(pid?: number): Promise<ToolResult> {
    if (!pid) {
      return Promise.resolve(this.error('NO_PID', 'No PID specified', '请指定进程 ID。'));
    }

    const cmd = process.platform === 'win32'
      ? `powershell.exe -NoProfile -Command "Get-Process -Id ${pid} | Select-Object * | ConvertTo-Json"`
      : `ps -p ${pid} -o pid,comm,%cpu,%mem,etime`;

    return new Promise((resolve) => {
      exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve(this.error('PROCESS_NOT_FOUND', error.message, `未找到进程 ${pid}。`));
          return;
        }
        resolve(this.success({ output: stdout?.toString() }, `进程 ${pid} 信息已获取。`));
      });
    });
  }

  private async killProcess(pid?: number, force = false): Promise<ToolResult> {
    if (!pid) {
      return this.error('NO_PID', 'No PID specified', '请指定要结束的进程 ID。');
    }

    // Safety: prevent killing system processes
    if (pid <= 4) {
      return this.error(
        'SYSTEM_PROCESS',
        'Cannot kill system process',
        '无法结束系统核心进程。',
        false,
      );
    }

    try {
      process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');
      return this.success({ pid }, `已发送结束信号到进程 ${pid}。`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.error('KILL_FAILED', message, `无法结束进程 ${pid}。`, false);
    }
  }
}
