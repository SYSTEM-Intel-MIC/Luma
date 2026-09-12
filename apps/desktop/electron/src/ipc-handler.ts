import { ipcMain } from 'electron';
import { IpcChannel } from '@luma/shared';
import type { AgentService } from './agent-service.js';
import type { ConfigService } from './config-service.js';
import type { WindowManager } from './window-manager.js';

export class IpcHandler {
  constructor(
    private agentService: AgentService,
    private configService: ConfigService,
    private windowManager: WindowManager,
  ) {}

  register(): void {
    // Window controls
    ipcMain.handle(IpcChannel.WINDOW_SHOW, () => this.windowManager.show());
    ipcMain.handle(IpcChannel.WINDOW_HIDE, () => this.windowManager.hide());
    ipcMain.handle(IpcChannel.WINDOW_CLOSE, () => this.windowManager.hide());

    // Agent
    ipcMain.handle(IpcChannel.AGENT_SEND_MESSAGE, async (_event, message: string) => {
      return this.agentService.runTask(message);
    });

    ipcMain.handle(IpcChannel.AGENT_PAUSE, () => this.agentService.pause());
    ipcMain.handle(IpcChannel.AGENT_RESUME, () => this.agentService.resume());
    ipcMain.handle(IpcChannel.AGENT_CANCEL, () => this.agentService.cancel());

    // Config
    ipcMain.handle(IpcChannel.CONFIG_GET, () => this.configService.getConfig());
    ipcMain.handle(IpcChannel.CONFIG_SET, (_event, key: string, value: unknown) => {
      this.configService.set(key, value);
    });
    ipcMain.handle(IpcChannel.CONFIG_RESET, () => this.configService.reset());

    // Memory
    ipcMain.handle(IpcChannel.MEMORY_GET_ALL, () => this.agentService.getMemories());
    ipcMain.handle(IpcChannel.MEMORY_ADD, (_event, content: string, category: string) => {
      return this.agentService.addMemory(content, category);
    });
    ipcMain.handle(IpcChannel.MEMORY_DELETE, (_event, id: string) => {
      return this.agentService.deleteMemory(id);
    });
    ipcMain.handle(IpcChannel.MEMORY_CLEAR, () => this.agentService.clearMemories());

    // Task history
    ipcMain.handle(IpcChannel.TASK_GET_HISTORY, () => this.agentService.getTaskHistory());
    ipcMain.handle(IpcChannel.TASK_DELETE, (_event, taskId: string) => {
      return this.agentService.deleteTask(taskId);
    });
    ipcMain.handle(IpcChannel.TASK_CLEAR_HISTORY, () => this.agentService.clearTaskHistory());

    // Permission
    ipcMain.handle(IpcChannel.PERMISSION_RESPOND, (_event, requestId: string, decision: string) => {
      this.agentService.respondToPermission(requestId, decision);
    });

    // System
    ipcMain.handle(IpcChannel.SYSTEM_GET_INFO, () => ({
      platform: process.platform,
      arch: process.arch,
      version: process.versions.electron,
      nodeVersion: process.versions.node,
    }));
  }
}
