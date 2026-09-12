/** Application constants */
export const APP_NAME = 'Luma';
export const APP_VERSION = '0.1.0';
export const APP_ID = 'com.system-intel-mic.luma';
export const DEVELOPER = 'SYSTEM-Intel-MIC';
export const LICENSE = 'GPL-3.0';

/** Default data directory */
export const DATA_DIR_NAME = 'Luma';

/** Default hotkey */
export const DEFAULT_HOTKEY = 'Control+Space';

/** Dangerous directories that should never be modified */
export const PROTECTED_DIRECTORIES = [
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
  'C:\\$Recycle.Bin',
  'C:\\System Volume Information',
];

/** Dangerous shell commands */
export const DANGEROUS_COMMANDS = [
  'format',
  'del /s',
  'rd /s',
  'rmdir /s',
  'Remove-Item -Recurse',
  'shutdown',
  'restart',
  'reg delete',
  'netsh advfirewall',
  'Set-MpPreference -DisableRealtimeMonitoring',
  'bcdedit',
  'diskpart',
  'cipher /w',
];

/** File types for document understanding */
export const SUPPORTED_DOCUMENT_TYPES = [
  '.pdf', '.txt', '.md', '.csv', '.json',
  '.docx', '.xlsx', '.pptx',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp',
];

/** Max file size for document processing (10MB) */
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
