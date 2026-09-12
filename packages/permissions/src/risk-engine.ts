import { PROTECTED_DIRECTORIES, DANGEROUS_COMMANDS } from '@luma/shared';
import type { RiskEvaluation } from '@luma/shared';
import { PermissionLevel } from '@luma/shared';

/** Risk analysis input */
interface RiskInput {
  toolName: string;
  action: string;
  arguments: Record<string, unknown>;
  targetPath?: string;
  scope?: number;
  reversible?: boolean;
}

/** Risk engine — independently evaluates operation risk */
export class RiskEngine {
  /** Evaluate risk of an operation */
  evaluate(input: RiskInput): RiskEvaluation {
    let riskLevel = PermissionLevel.LOW;
    let reason = '';
    let blocked = false;
    const details: Record<string, unknown> = {
      tool: input.toolName,
      action: input.action,
    };

    // Check if target is a protected directory
    if (input.targetPath) {
      const normalized = input.targetPath.toLowerCase().replace(/\//g, '\\');
      const isProtected = PROTECTED_DIRECTORIES.some((dir) =>
        normalized.startsWith(dir.toLowerCase()),
      );
      if (isProtected) {
        return {
          riskLevel: PermissionLevel.CRITICAL,
          reason: `操作目标位于系统保护目录: ${input.targetPath}`,
          requiresApproval: true,
          blocked: true,
          details: { ...details, targetPath: input.targetPath },
        };
      }
    }

    // Evaluate by tool type
    switch (input.toolName) {
      case 'filesystem.delete':
      case 'filesystem.remove':
        riskLevel = this.evaluateDeleteRisk(input);
        reason = this.getDeleteReason(input);
        break;

      case 'filesystem.write':
      case 'filesystem.create':
        riskLevel = input.reversible === false
          ? PermissionLevel.HIGH
          : PermissionLevel.MEDIUM;
        reason = '文件写入操作';
        break;

      case 'filesystem.move':
      case 'filesystem.rename':
        riskLevel = PermissionLevel.MEDIUM;
        reason = '文件移动/重命名操作';
        break;

      case 'shell.execute':
        riskLevel = this.evaluateShellRisk(input);
        reason = 'Shell 命令执行';
        blocked = this.isShellBlocked(input);
        break;

      case 'process.kill':
        riskLevel = PermissionLevel.HIGH;
        reason = '结束进程操作';
        break;

      case 'system.modify':
        riskLevel = PermissionLevel.CRITICAL;
        reason = '系统修改操作';
        blocked = true;
        break;

      case 'computer.use':
        riskLevel = PermissionLevel.HIGH;
        reason = '电脑控制操作';
        break;

      default:
        riskLevel = PermissionLevel.LOW;
        reason = '标准操作';
    }

    // Scale risk by scope (number of items)
    if (input.scope && input.scope > 10) {
      riskLevel = Math.min(riskLevel + 1, PermissionLevel.CRITICAL) as PermissionLevel;
      reason += ` (批量操作: ${input.scope} 项)`;
    }

    // Reversible operations are lower risk
    if (input.reversible && riskLevel > PermissionLevel.LOW) {
      riskLevel = Math.max(riskLevel - 1, PermissionLevel.LOW) as PermissionLevel;
    }

    return {
      riskLevel,
      reason,
      requiresApproval: riskLevel >= PermissionLevel.MEDIUM,
      blocked,
      details,
    };
  }

  /** Evaluate delete risk based on scope and target */
  private evaluateDeleteRisk(input: RiskInput): PermissionLevel {
    const scope = input.scope ?? 1;
    if (scope > 100) return PermissionLevel.CRITICAL;
    if (scope > 10) return PermissionLevel.HIGH;
    if (scope > 1) return PermissionLevel.MEDIUM;
    return PermissionLevel.MEDIUM;
  }

  /** Get human-readable delete reason */
  private getDeleteReason(input: RiskInput): string {
    const scope = input.scope ?? 1;
    if (scope > 1) return `删除 ${scope} 个文件/目录`;
    return `删除: ${input.targetPath ?? '未知'}`;
  }

  /** Evaluate shell command risk */
  private evaluateShellRisk(input: RiskInput): PermissionLevel {
    const command = (input.arguments['command'] as string) ?? '';
    const lowerCmd = command.toLowerCase();

    // Check for dangerous commands
    for (const dangerous of DANGEROUS_COMMANDS) {
      if (lowerCmd.includes(dangerous.toLowerCase())) {
        return PermissionLevel.CRITICAL;
      }
    }

    // Read-only commands are low risk
    const readOnlyPrefixes = [
      'get-', 'dir', 'ls', 'cat', 'type', 'echo',
      'ipconfig', 'hostname', 'whoami', 'systeminfo',
      'tasklist', 'netstat', 'nslookup', 'ping',
    ];
    const firstWord = lowerCmd.split(/\s+/)[0] ?? '';
    if (readOnlyPrefixes.some((p) => firstWord.startsWith(p))) {
      return PermissionLevel.LOW;
    }

    // Write commands are medium risk
    const writePrefixes = [
      'set-', 'new-', 'add-', 'copy', 'move', 'rename',
      'mkdir', 'md', 'net ', 'reg query',
    ];
    if (writePrefixes.some((p) => lowerCmd.startsWith(p) || lowerCmd.includes(p))) {
      return PermissionLevel.MEDIUM;
    }

    // Default: medium risk for unknown commands
    return PermissionLevel.MEDIUM;
  }

  /** Check if a shell command should be blocked entirely */
  private isShellBlocked(input: RiskInput): boolean {
    const command = (input.arguments['command'] as string) ?? '';
    const lowerCmd = command.toLowerCase();

    const blockedPatterns = [
      'format',
      'diskpart',
      'bcdedit',
      'cipher /w',
      'set-mppreference -disablerealtimemonitoring',
      'netsh advfirewall set',
      'reg delete',
      'takeown',
      'icacls /reset',
      'shutdown /s',
      'shutdown /r',
      'restart-computer',
      'stop-computer',
    ];

    return blockedPatterns.some((pattern) => lowerCmd.includes(pattern));
  }
}
