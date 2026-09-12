import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory, PermissionLevel, DANGEROUS_COMMANDS } from '@luma/shared';
import { exec } from 'node:child_process';

const inputSchema = z.object({
  command: z.string().describe('要执行的命令'),
  shell: z.enum(['powershell', 'cmd', 'bash']).optional().default('powershell').describe('使用的 Shell'),
  cwd: z.string().optional().describe('工作目录'),
  timeout: z.number().optional().default(30000).describe('超时时间（毫秒）'),
});

/** Shell tool — execute commands with security analysis */
export class ShellTool extends BaseTool {
  get metadata(): ToolMetadata {
    return {
      name: 'shell.execute',
      description: '执行 Shell 命令（PowerShell/CMD/Bash）。命令会经过安全分析。',
      category: ToolCategory.SHELL,
      inputSchema,
      riskLevel: PermissionLevel.MEDIUM,
      requiresPermission: true,
      supportsRollback: false,
    };
  }

  async execute(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const { command, shell, cwd, timeout } = input;

    // Security check: analyze command risk
    const riskAnalysis = this.analyzeCommandRisk(command);
    if (riskAnalysis.blocked) {
      return this.error(
        'COMMAND_BLOCKED',
        `Command blocked by security policy: ${command}`,
        `此命令已被安全策略阻止: ${riskAnalysis.reason}`,
        false,
      );
    }

    return new Promise<ToolResult>((resolve) => {
      const shellCmd = this.wrapCommand(command, shell);
      const options: Record<string, unknown> = {
        timeout: timeout ?? 30000,
        maxBuffer: 10 * 1024 * 1024,
        ...(cwd ? { cwd } : {}),
      };

      exec(shellCmd, options as Parameters<typeof exec>[1], (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            resolve(this.error('COMMAND_TIMEOUT', 'Command timed out', '命令执行超时。', true));
          } else {
            resolve({
              success: false,
              data: { stdout: stdout?.toString(), stderr: stderr?.toString(), exitCode: error.code },
              userMessage: `命令执行出错。`,
              error: {
                code: 'COMMAND_FAILED',
                message: error.message,
                userMessage: '命令执行出错。',
                retryable: false,
                details: { stderr: stderr?.toString() },
              },
            });
          }
          return;
        }

        resolve(this.success(
          {
            stdout: stdout?.toString() ?? '',
            stderr: stderr?.toString() ?? '',
            exitCode: 0,
          },
          '命令执行完成。',
          `Exit code: 0`,
        ));
      });
    });
  }

  /** Analyze command risk level */
  private analyzeCommandRisk(command: string): { blocked: boolean; reason: string; riskLevel: number } {
    const lower = command.toLowerCase();

    for (const dangerous of DANGEROUS_COMMANDS) {
      if (lower.includes(dangerous.toLowerCase())) {
        return {
          blocked: true,
          reason: `包含危险命令: ${dangerous}`,
          riskLevel: PermissionLevel.CRITICAL,
        };
      }
    }

    // Read-only commands are safe
    const safePatterns = [
      /^get-/i, /^dir\b/i, /^ls\b/i, /^cat\b/i, /^type\b/i,
      /^echo\b/i, /^whoami\b/i, /^hostname\b/i, /^ipconfig\b/i,
      /^tasklist\b/i, /^netstat\b/i, /^ping\b/i, /^nslookup\b/i,
      /^systeminfo\b/i,
    ];

    const firstWord = lower.split(/\s+/)[0] ?? '';
    const isSafe = safePatterns.some((p) => firstWord.match(p));

    return {
      blocked: false,
      reason: isSafe ? '只读命令' : '标准命令',
      riskLevel: isSafe ? PermissionLevel.LOW : PermissionLevel.MEDIUM,
    };
  }

  /** Wrap command for the specified shell */
  private wrapCommand(command: string, shell: string): string {
    switch (shell) {
      case 'powershell':
        return `powershell.exe -NoProfile -Command "${command.replace(/"/g, '\\"')}"`;
      case 'cmd':
        return `cmd.exe /c "${command.replace(/"/g, '\\"')}"`;
      case 'bash':
        return command;
      default:
        return command;
    }
  }
}
