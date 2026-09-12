import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannel } from '@luma/shared';

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('lumaAPI', {
  // Window
  showWindow: () => ipcRenderer.invoke(IpcChannel.WINDOW_SHOW),
  hideWindow: () => ipcRenderer.invoke(IpcChannel.WINDOW_HIDE),
  closeWindow: () => ipcRenderer.invoke(IpcChannel.WINDOW_CLOSE),

  // Agent
  sendMessage: (message: string) => ipcRenderer.invoke(IpcChannel.AGENT_SEND_MESSAGE, message),
  pause: () => ipcRenderer.invoke(IpcChannel.AGENT_PAUSE),
  resume: () => ipcRenderer.invoke(IpcChannel.AGENT_RESUME),
  cancel: () => ipcRenderer.invoke(IpcChannel.AGENT_CANCEL),

  // Config
  getConfig: () => ipcRenderer.invoke(IpcChannel.CONFIG_GET),
  setConfig: (key: string, value: unknown) => ipcRenderer.invoke(IpcChannel.CONFIG_SET, key, value),
  resetConfig: () => ipcRenderer.invoke(IpcChannel.CONFIG_RESET),

  // Memory
  getMemories: () => ipcRenderer.invoke(IpcChannel.MEMORY_GET_ALL),
  addMemory: (content: string, category: string) => ipcRenderer.invoke(IpcChannel.MEMORY_ADD, content, category),
  deleteMemory: (id: string) => ipcRenderer.invoke(IpcChannel.MEMORY_DELETE, id),
  clearMemories: () => ipcRenderer.invoke(IpcChannel.MEMORY_CLEAR),

  // Task
  getTaskHistory: () => ipcRenderer.invoke(IpcChannel.TASK_GET_HISTORY),
  deleteTask: (taskId: string) => ipcRenderer.invoke(IpcChannel.TASK_DELETE),
  clearTaskHistory: () => ipcRenderer.invoke(IpcChannel.TASK_CLEAR_HISTORY),

  // Permission
  respondToPermission: (requestId: string, decision: string) =>
    ipcRenderer.invoke(IpcChannel.PERMISSION_RESPOND, requestId, decision),

  // System
  getSystemInfo: () => ipcRenderer.invoke(IpcChannel.SYSTEM_GET_INFO),

  // Events from main process
  onAgentEvent: (callback: (event: unknown) => void) => {
    ipcRenderer.on('luma:agent-event', (_event, data) => callback(data));
  },
  onPermissionRequest: (callback: (request: unknown) => void) => {
    ipcRenderer.on('luma:permission-request', (_event, data) => callback(data));
  },
  onNewTask: (callback: () => void) => {
    ipcRenderer.on('luma:new-task', () => callback());
  },
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('luma:open-settings', () => callback());
  },
});
