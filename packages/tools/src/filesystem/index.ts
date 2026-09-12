import { z } from 'zod';
import { BaseTool } from '../base-tool.js';
import type { ToolMetadata, ToolResult } from '@luma/shared';
import { ToolCategory, PermissionLevel, isProtectedPath, formatFileSize } from '@luma/shared';
import fs from 'node:fs/promises';
import path from 'node:path';

const inputSchema = z.object({
  action: z.enum([
    'list', 'read', 'write', 'create_dir', 'copy', 'move',
    'rename', 'delete', 'info', 'search',
  ]),
  path: z.string().describe('文件路径或目录路径'),
  target: z.string().optional().describe('目标路径（用于 copy/move/rename）'),
  content: z.string().optional().describe('文件内容（用于 write）'),
  recursive: z.boolean().optional().default(false).describe('是否递归操作'),
  pattern: z.string().optional().describe('搜索模式（用于 search）'),
  extension: z.string().optional().describe('文件扩展名过滤'),
  limit: z.number().optional().default(100).describe('结果数量限制'),
});

/** Filesystem tool — file operations */
export class FilesystemTool extends BaseTool {
  get metadata(): ToolMetadata {
    return {
      name: 'filesystem',
      description: '文件和目录操作：列出、读取、写入、搜索、复制、移动、重命名、删除文件和目录。',
      category: ToolCategory.FILESYSTEM,
      inputSchema,
      riskLevel: PermissionLevel.LOW,
      requiresPermission: false,
      supportsRollback: true,
    };
  }

  async execute(input: z.infer<typeof inputSchema>): Promise<ToolResult> {
    const { action, path: filePath } = input;

    // Safety check: never operate on protected directories
    if (isProtectedPath(filePath)) {
      return this.error(
        'PROTECTED_PATH',
        `Attempted to operate on protected path: ${filePath}`,
        '无法操作系统保护目录。',
        false,
      );
    }

    try {
      switch (action) {
        case 'list':
          return await this.listDirectory(filePath, input.recursive ?? false, input.limit ?? 100);
        case 'read':
          return await this.readFile(filePath);
        case 'write':
          return await this.writeFile(filePath, input.content ?? '');
        case 'create_dir':
          return await this.createDirectory(filePath);
        case 'copy':
          return await this.copy(filePath, input.target ?? '');
        case 'move':
          return await this.move(filePath, input.target ?? '');
        case 'rename':
          return await this.rename(filePath, input.target ?? '');
        case 'delete':
          return await this.delete(filePath, input.recursive ?? false);
        case 'info':
          return await this.getInfo(filePath);
        case 'search':
          return await this.search(filePath, input.pattern, input.extension, input.limit ?? 100);
        default:
          return this.error('UNKNOWN_ACTION', `Unknown action: ${action}`, '未知的操作类型。');
      }
    } catch (err) {
      return this.handleFsError(err, filePath);
    }
  }

  private async listDirectory(dirPath: string, recursive: boolean, limit: number): Promise<ToolResult> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const items: Array<{ name: string; type: string; size?: number; path: string }> = [];

    for (const entry of entries) {
      if (items.length >= limit) break;
      const fullPath = path.join(dirPath, entry.name);
      const item: { name: string; type: string; size?: number; path: string } = {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        path: fullPath,
      };

      if (entry.isFile()) {
        try {
          const stat = await fs.stat(fullPath);
          item.size = stat.size;
        } catch { /* ignore */ }
      }

      items.push(item);

      if (recursive && entry.isDirectory()) {
        const subItems = await fs.readdir(fullPath, { withFileTypes: true }).catch(() => []);
        for (const sub of subItems) {
          if (items.length >= limit) break;
          items.push({
            name: sub.name,
            type: sub.isDirectory() ? 'directory' : 'file',
            path: path.join(fullPath, sub.name),
          });
        }
      }
    }

    return this.success(
      { path: dirPath, count: items.length, items },
      `找到 ${items.length} 个项目。`,
      `Directory: ${dirPath}, Items: ${items.length}`,
    );
  }

  private async readFile(filePath: string): Promise<ToolResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stat = await fs.stat(filePath);
    return this.success(
      { path: filePath, content, size: stat.size },
      `已读取文件: ${path.basename(filePath)} (${formatFileSize(stat.size)})`,
    );
  }

  private async writeFile(filePath: string, content: string): Promise<ToolResult> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return this.success(
      { path: filePath, bytesWritten: Buffer.byteLength(content) },
      `已写入文件: ${path.basename(filePath)}`,
    );
  }

  private async createDirectory(dirPath: string): Promise<ToolResult> {
    await fs.mkdir(dirPath, { recursive: true });
    return this.success({ path: dirPath }, `已创建目录: ${path.basename(dirPath)}`);
  }

  private async copy(source: string, target: string): Promise<ToolResult> {
    const stat = await fs.stat(source);
    if (stat.isDirectory()) {
      await fs.cp(source, target, { recursive: true });
    } else {
      await fs.copyFile(source, target);
    }
    return this.success({ source, target }, `已复制: ${path.basename(source)} → ${path.basename(target)}`);
  }

  private async move(source: string, target: string): Promise<ToolResult> {
    await fs.rename(source, target);
    return this.success({ source, target }, `已移动: ${path.basename(source)} → ${path.basename(target)}`);
  }

  private async rename(filePath: string, newName: string): Promise<ToolResult> {
    const dir = path.dirname(filePath);
    const newPath = path.join(dir, newName);
    await fs.rename(filePath, newPath);
    return this.success(
      { oldPath: filePath, newPath },
      `已重命名: ${path.basename(filePath)} → ${newName}`,
    );
  }

  private async delete(filePath: string, recursive: boolean): Promise<ToolResult> {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive, force: true });
    } else {
      await fs.unlink(filePath);
    }
    return this.success({ path: filePath }, `已删除: ${path.basename(filePath)}`);
  }

  private async getInfo(filePath: string): Promise<ToolResult> {
    const stat = await fs.stat(filePath);
    return this.success(
      {
        path: filePath,
        name: path.basename(filePath),
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        sizeFormatted: formatFileSize(stat.size),
        created: stat.birthtime.toISOString(),
        modified: stat.mtime.toISOString(),
        accessed: stat.atime.toISOString(),
        permissions: stat.mode.toString(8),
      },
      `${path.basename(filePath)}: ${stat.isDirectory() ? '目录' : '文件'}, ${formatFileSize(stat.size)}`,
    );
  }

  private async search(
    dirPath: string,
    pattern?: string,
    extension?: string,
    limit = 100,
  ): Promise<ToolResult> {
    const results: Array<{ name: string; path: string; size: number; modified: string }> = [];

    const searchDir = async (dir: string): Promise<void> => {
      if (results.length >= limit) return;

      const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        if (results.length >= limit) return;
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile()) {
          let matches = true;
          if (pattern && !entry.name.toLowerCase().includes(pattern.toLowerCase())) {
            matches = false;
          }
          if (extension && !entry.name.toLowerCase().endsWith(extension.toLowerCase())) {
            matches = false;
          }
          if (matches) {
            const stat = await fs.stat(fullPath).catch(() => null);
            if (stat) {
              results.push({
                name: entry.name,
                path: fullPath,
                size: stat.size,
                modified: stat.mtime.toISOString(),
              });
            }
          }
        } else if (entry.isDirectory()) {
          await searchDir(fullPath);
        }
      }
    };

    await searchDir(dirPath);

    return this.success(
      { count: results.length, results },
      `搜索完成，找到 ${results.length} 个文件。`,
    );
  }

  private handleFsError(err: unknown, filePath: string): ToolResult {
    const error = err as NodeJS.ErrnoException;
    switch (error.code) {
      case 'ENOENT':
        return this.error('FILE_NOT_FOUND', error.message, `文件或目录不存在: ${path.basename(filePath)}`, false);
      case 'EACCES':
      case 'EPERM':
        return this.error('FILE_PERMISSION', error.message, '没有权限访问此文件或目录。', false);
      case 'EBUSY':
        return this.error('FILE_LOCKED', error.message, '文件正在被其他程序使用。', true);
      case 'ENAMETOOLONG':
        return this.error('PATH_TOO_LONG', error.message, '路径名称过长。', false);
      default:
        return this.error('FS_ERROR', error.message, '文件系统操作出错。', false);
    }
  }
}
