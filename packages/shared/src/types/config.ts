import type { AgentConfig } from './agent.js';
import type { ProviderConfig } from './model.js';
import type { MemoryMode } from './memory.js';

/** Application configuration */
export interface AppConfig {
  configVersion: number;
  general: GeneralConfig;
  models: ModelConfig;
  agent: AgentConfig;
  memory: MemoryConfig;
  history: HistoryConfig;
  permissions: PermissionsConfig;
  privacy: PrivacyConfig;
}

/** General settings */
export interface GeneralConfig {
  launchAtStartup: boolean;
  hotkey: string;
  uiPosition: { x: number; y: number };
  uiSize: { width: number; height: number };
  autoHide: boolean;
  animations: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

/** Model settings */
export interface ModelConfig {
  providers: ProviderConfig[];
  defaultProvider?: string;
  defaultModel?: string;
  autoRoute: boolean;
}

/** Memory settings */
export interface MemoryConfig {
  enabled: boolean;
  mode: MemoryMode;
  maxEntries: number;
}

/** History settings */
export interface HistoryConfig {
  enabled: boolean;
  retentionDays: number;
  maxEntries: number;
}

/** Permissions settings */
export interface PermissionsConfig {
  autoExecuteLevel: number;
  rules: Array<{
    toolName: string;
    action: string;
    decision: 'granted' | 'denied';
  }>;
}

/** Privacy settings */
export interface PrivacyConfig {
  telemetry: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dataLocation: string;
}

/** Default configuration */
export const DEFAULT_CONFIG: AppConfig = {
  configVersion: 1,
  general: {
    launchAtStartup: true,
    hotkey: 'Control+Space',
    uiPosition: { x: -1, y: -1 },
    uiSize: { width: 480, height: 360 },
    autoHide: true,
    animations: true,
    language: 'zh-CN',
    theme: 'system',
  },
  models: {
    providers: [],
    autoRoute: true,
  },
  agent: {
    maxSteps: 50,
    maxExecutionTimeMs: 300000,
    toolTimeoutMs: 30000,
    retryLimit: 3,
    tokenBudget: 128000,
    autoExecuteLevel: 1,
  },
  memory: {
    enabled: true,
    mode: 'ai_suggest' as MemoryMode,
    maxEntries: 1000,
  },
  history: {
    enabled: true,
    retentionDays: 90,
    maxEntries: 10000,
  },
  permissions: {
    autoExecuteLevel: 1,
    rules: [],
  },
  privacy: {
    telemetry: false,
    logLevel: 'info',
    dataLocation: '',
  },
};
