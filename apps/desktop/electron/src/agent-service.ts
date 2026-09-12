import type { AppConfig, Task, MemoryEntry, MemoryCategory, PermissionDecision } from '@luma/shared';
import { PermissionScopeType, MemoryMode } from '@luma/shared';
import { AgentRuntime, type AgentEvent } from '@luma/agent';
import { ModelRouter } from '@luma/models';
import { ToolRegistry, FilesystemTool, ShellTool, WindowsTool, NetworkTool, ProcessTool, SystemTool } from '@luma/tools';
import { PermissionManager, RiskEngine } from '@luma/permissions';
import { MemoryManager } from '@luma/memory';
import { Database, ConfigStore, TaskStore, MemoryStore, HistoryStore } from '@luma/storage';
import type { ConfigService } from './config-service.js';
import { BrowserWindow } from 'electron';

export class AgentService {
  private db: Database;
  private configStore: ConfigStore;
  private taskStore: TaskStore;
  private memoryStore: MemoryStore;
  private historyStore: HistoryStore;
  private modelRouter: ModelRouter;
  private toolRegistry: ToolRegistry;
  private permissionManager: PermissionManager;
  private riskEngine: RiskEngine;
  private memoryManager: MemoryManager;
  private agentRuntime: AgentRuntime | null = null;
  private configService: ConfigService;
  private pendingPermissions: Map<string, (decision: PermissionDecision) => void> = new Map();

  constructor(configService: ConfigService, dataDir: string) {
    this.configService = configService;
    this.db = new Database(dataDir);
    this.configStore = new ConfigStore(this.db);
    this.taskStore = new TaskStore(this.db);
    this.memoryStore = new MemoryStore(this.db);
    this.historyStore = new HistoryStore(this.db);

    this.modelRouter = new ModelRouter();
    this.toolRegistry = new ToolRegistry();
    this.riskEngine = new RiskEngine();

    const config = this.configService.getConfig();
    this.permissionManager = new PermissionManager(config.agent.autoExecuteLevel);
    this.memoryManager = new MemoryManager(
      this.memoryStore,
      config.memory.enabled,
      config.memory.mode as MemoryMode,
    );
  }

  async initialize(): Promise<void> {
    // Register tools
    this.toolRegistry.register(new FilesystemTool());
    this.toolRegistry.register(new ShellTool());
    this.toolRegistry.register(new WindowsTool());
    this.toolRegistry.register(new NetworkTool());
    this.toolRegistry.register(new ProcessTool());
    this.toolRegistry.register(new SystemTool());

    // Configure model providers
    const config = this.configService.getConfig();
    for (const providerConfig of config.models.providers) {
      if (providerConfig.enabled && providerConfig.apiKey) {
        this.modelRouter.registerProvider(providerConfig);
      }
    }

    // Set up permission handler
    this.permissionManager.onPermissionRequest = (request) => {
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        win.webContents.send('luma:permission-request', request);
      }
    };

    // Initialize agent runtime
    const agentConfig = config.agent;
    this.agentRuntime = new AgentRuntime({
      config: agentConfig,
      modelRouter: this.modelRouter,
      toolRegistry: this.toolRegistry,
      permissionManager: this.permissionManager,
      riskEngine: this.riskEngine,
      memoryManager: this.memoryManager,
      taskStore: this.taskStore,
      historyStore: this.historyStore,
    });
  }

  async runTask(message: string): Promise<Task | null> {
    if (!this.agentRuntime) return null;

    const windows = BrowserWindow.getAllWindows();
    const onEvent = (event: AgentEvent) => {
      for (const win of windows) {
        win.webContents.send('luma:agent-event', event);
      }
    };

    return this.agentRuntime.run(message, onEvent);
  }

  pause(): void {
    this.agentRuntime?.pause();
  }

  resume(): void {
    this.agentRuntime?.resume();
  }

  cancel(): void {
    this.agentRuntime?.cancel();
  }

  respondToPermission(requestId: string, decision: string): void {
    const pending = this.pendingPermissions.get(requestId);
    if (pending) {
      const d = decision === 'granted'
        ? PermissionDecision.GRANTED
        : PermissionDecision.DENIED;
      this.permissionManager.respondToPermission(requestId, d);
      this.pendingPermissions.delete(requestId);
    }
  }

  async getMemories(): Promise<MemoryEntry[]> {
    return this.memoryManager.getAll();
  }

  async addMemory(content: string, category: string): Promise<MemoryEntry | null> {
    return this.memoryManager.addFromUser(content, category as MemoryCategory);
  }

  async deleteMemory(id: string): Promise<void> {
    return this.memoryManager.delete(id);
  }

  async clearMemories(): Promise<void> {
    return this.memoryManager.clear();
  }

  async getTaskHistory(): Promise<Task[]> {
    return this.taskStore.getRecent(100);
  }

  async deleteTask(taskId: string): Promise<void> {
    this.taskStore.delete(taskId);
  }

  async clearTaskHistory(): Promise<void> {
    this.taskStore.clearAll();
  }

  dispose(): void {
    this.db.close();
  }
}
