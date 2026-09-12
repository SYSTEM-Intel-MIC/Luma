import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory, PermissionLevel } from '@luma/shared';
import { exec } from 'node:child_process';
import os from 'node:os';

const inputSchema = z.object({
  action: z.enum(['ping', 'dns_resolve', 'connectivity_check', 'adapters', 'diagnose']),
  target: z.string().optional().describe('目标主机（用于 ping）'),
  timeout: z.number().optional().default(10000).describe('超时时间（毫秒）'),
});

/** Network diagnostic tool */
export class NetworkTool extends BaseTool {
  get metadata(): ToolMetadata {
    return {
      name: 'network',
      description: '网络诊断工具：Ping、DNS解析、连通性检查、网络适配器信息。',
      category: ToolCategory.NETWORK,
      inputSchema,
      riskLevel: PermissionLevel.NONE,
      requiresPermission: false,
      supportsRollback: false,
    };
  }

  async execute(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    switch (input.action) {
      case 'ping':
        return this.ping(input.target ?? '8.8.8.8', input.timeout ?? 10000);
      case 'dns_resolve':
        return this.dnsResolve(input.target ?? 'google.com');
      case 'connectivity_check':
        return this.connectivityCheck();
      case 'adapters':
        return this.getAdapters();
      case 'diagnose':
        return this.fullDiagnose();
      default:
        return this.error('UNKNOWN_ACTION', `Unknown: ${input.action}`, '未知操作。');
    }
  }

  private async ping(target: string, timeout: number): Promise<ToolResult> {
    const count = process.platform === 'win32' ? '-n 4' : '-c 4';
    const timeoutFlag = process.platform === 'win32' ? `-w ${timeout}` : `-W ${Math.ceil(timeout / 1000)}`;

    return this.runCommand(`ping ${count} ${timeoutFlag} ${target}`, timeout + 5000);
  }

  private async dnsResolve(target: string): Promise<ToolResult> {
    return this.runCommand(`nslookup ${target}`, 10000);
  }

  private async connectivityCheck(): Promise<ToolResult> {
    const targets = ['8.8.8.8', '1.1.1.1', 'google.com'];
    const results: Array<{ target: string; reachable: boolean; latency?: string }> = [];

    for (const target of targets) {
      try {
        const result = await this.ping(target, 5000);
        results.push({
          target,
          reachable: result.success,
          latency: result.success ? 'OK' : 'timeout',
        });
      } catch {
        results.push({ target, reachable: false });
      }
    }

    const reachable = results.some((r) => r.reachable);
    return this.success(
      { reachable, results },
      reachable ? '网络连接正常。' : '网络连接异常，无法访问外部服务。',
    );
  }

  private getAdapters(): ToolResult {
    const interfaces = os.networkInterfaces();
    const adapters: Record<string, unknown[]> = {};
    for (const [name, addrs] of Object.entries(interfaces)) {
      adapters[name] = (addrs ?? []).map((a) => ({
        address: a.address,
        family: a.family,
        internal: a.internal,
        mac: a.mac,
      }));
    }
    return this.success({ adapters }, `找到 ${Object.keys(adapters).length} 个网络适配器。`);
  }

  private async fullDiagnose(): Promise<ToolResult> {
    const results: Record<string, unknown> = {};

    // Network adapters
    const adaptersResult = this.getAdapters();
    results.adapters = adaptersResult.data;

    // Connectivity
    const connResult = await this.connectivityCheck();
    results.connectivity = connResult.data;

    // DNS
    const dnsResult = await this.dnsResolve('google.com');
    results.dns = dnsResult.data;

    const issues: string[] = [];
    if (!(connResult.data as Record<string, unknown>)?.['reachable']) {
      issues.push('无法连接互联网');
    }

    const message = issues.length === 0
      ? '网络诊断完成，一切正常。'
      : `网络诊断完成，发现以下问题:\n${issues.join('\n')}`;

    return this.success(results, message);
  }

  private runCommand(command: string, timeout: number): Promise<ToolResult> {
    return new Promise((resolve) => {
      exec(command, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            data: { stdout: stdout?.toString(), stderr: stderr?.toString() },
            userMessage: '网络操作失败。',
            error: {
              code: 'NETWORK_ERROR',
              message: error.message,
              userMessage: '网络操作失败。',
              retryable: true,
            },
          });
        } else {
          resolve(this.success(
            { stdout: stdout?.toString(), stderr: stderr?.toString() },
            '网络操作完成。',
          ));
        }
      });
    });
  }
}
