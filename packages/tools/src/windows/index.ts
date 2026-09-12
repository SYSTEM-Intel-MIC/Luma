import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory, PermissionLevel } from '@luma/shared';
import os from 'node:os';

const inputSchema = z.object({
  action: z.enum([
    'system_info', 'cpu_usage', 'memory_usage', 'disk_usage',
    'network_adapters', 'os_version', 'uptime',
  ]),
});

/** Windows system information tool */
export class WindowsTool extends BaseTool {
  get metadata(): ToolMetadata {
    return {
      name: 'windows.system',
      description: '获取 Windows 系统信息：CPU、内存、磁盘、网络适配器、系统版本等。',
      category: ToolCategory.WINDOWS,
      inputSchema,
      riskLevel: PermissionLevel.NONE,
      requiresPermission: false,
      supportsRollback: false,
    };
  }

  async execute(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    switch (input.action) {
      case 'system_info':
        return this.getSystemInfo();
      case 'cpu_usage':
        return this.getCpuUsage();
      case 'memory_usage':
        return this.getMemoryUsage();
      case 'disk_usage':
        return this.getDiskUsage();
      case 'network_adapters':
        return this.getNetworkAdapters();
      case 'os_version':
        return this.getOsVersion();
      case 'uptime':
        return this.getUptime();
      default:
        return this.error('UNKNOWN_ACTION', `Unknown action: ${input.action}`, '未知操作。');
    }
  }

  private getSystemInfo(): ToolResult {
    const cpus = os.cpus();
    return this.success(
      {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        osVersion: os.release(),
        osType: os.type(),
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model ?? 'Unknown',
        totalMemory: os.totalmem(),
        totalMemoryFormatted: this.formatBytes(os.totalmem()),
        freeMemory: os.freemem(),
        freeMemoryFormatted: this.formatBytes(os.freemem()),
        uptime: os.uptime(),
        uptimeFormatted: this.formatUptime(os.uptime()),
      },
      `系统: ${os.hostname()}, ${os.type()} ${os.release()}, ${cpus.length}核 CPU, ${this.formatBytes(os.totalmem())} 内存`,
    );
  }

  private getCpuUsage(): ToolResult {
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0);
    const totalTick = cpus.reduce(
      (sum, cpu) => sum + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq,
      0,
    );
    const usagePercent = totalTick > 0 ? ((1 - totalIdle / totalTick) * 100).toFixed(1) : '0';

    return this.success(
      {
        cpuCount: cpus.length,
        usagePercent: parseFloat(usagePercent),
        model: cpus[0]?.model ?? 'Unknown',
        loadAverage: os.loadavg(),
      },
      `CPU 使用率: ${usagePercent}% (${cpus.length} 核)`,
    );
  }

  private getMemoryUsage(): ToolResult {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = total > 0 ? ((used / total) * 100).toFixed(1) : '0';

    return this.success(
      {
        total,
        free,
        used,
        usagePercent: parseFloat(usagePercent),
        totalFormatted: this.formatBytes(total),
        freeFormatted: this.formatBytes(free),
        usedFormatted: this.formatBytes(used),
      },
      `内存: ${this.formatBytes(used)} / ${this.formatBytes(total)} (${usagePercent}%)`,
    );
  }

  private getDiskUsage(): ToolResult {
    // Node.js doesn't have a cross-platform disk usage API
    // This returns basic info; full implementation would use native module on Windows
    return this.success(
      { message: '磁盘信息需要通过系统命令获取' },
      '磁盘信息需要通过 Shell 命令获取更详细数据。',
    );
  }

  private getNetworkAdapters(): ToolResult {
    const interfaces = os.networkInterfaces();
    const adapters: Array<{
      name: string;
      address: string;
      family: string;
      internal: boolean;
      mac?: string;
    }> = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        adapters.push({
          name,
          address: addr.address,
          family: addr.family,
          internal: addr.internal,
          mac: addr.mac,
        });
      }
    }

    return this.success(
      { adapters },
      `找到 ${adapters.length} 个网络接口。`,
    );
  }

  private getOsVersion(): ToolResult {
    return this.success(
      {
        type: os.type(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
      `${os.type()} ${os.release()} (${os.arch()})`,
    );
  }

  private getUptime(): ToolResult {
    const uptimeSec = os.uptime();
    return this.success(
      { uptime: uptimeSec, formatted: this.formatUptime(uptimeSec) },
      `系统运行时间: ${this.formatUptime(uptimeSec)}`,
    );
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${mins}分钟`;
  }
}
