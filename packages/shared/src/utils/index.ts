import { PROTECTED_DIRECTORIES } from '../constants/index.js';

/** Generate a unique ID */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Format duration in human-readable format */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

/** Format file size in human-readable format */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Sanitize sensitive data from logs */
export function sanitizeForLog(data: string): string {
  return data
    .replace(/(?:sk-|key-|ghp_|AKIA)[a-zA-Z0-9_-]{16,}/g, '[REDACTED_KEY]')
    .replace(/password["\s:=]+["']?[^"'\s,}]+["']?/gi, 'password=[REDACTED]')
    .replace(/authorization["\s:=]+["']?[^"'\s,}]+["']?/gi, 'authorization=[REDACTED]')
    .replace(/cookie["\s:=]+["']?[^"'\s,}]+["']?/gi, 'cookie=[REDACTED]');
}

/** Truncate string to max length */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/** Check if a path is in a protected directory */
export function isProtectedPath(filePath: string): boolean {
  const normalized = filePath.toLowerCase().replace(/\//g, '\\');
  return PROTECTED_DIRECTORIES.some((dir: string) =>
    normalized.startsWith(dir.toLowerCase())
  );
}

/** Deep clone an object */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
