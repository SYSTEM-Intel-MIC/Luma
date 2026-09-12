/** IPC channel names */
export enum IpcChannel {
  // Window
  WINDOW_SHOW = 'window:show',
  WINDOW_HIDE = 'window:hide',
  WINDOW_CLOSE = 'window:close',
  WINDOW_MINIMIZE = 'window:minimize',
  WINDOW_GET_BOUNDS = 'window:getBounds',
  WINDOW_SET_BOUNDS = 'window:setBounds',

  // Agent
  AGENT_SEND_MESSAGE = 'agent:sendMessage',
  AGENT_STREAM = 'agent:stream',
  AGENT_STATE_CHANGED = 'agent:stateChanged',
  AGENT_PAUSE = 'agent:pause',
  AGENT_RESUME = 'agent:resume',
  AGENT_CANCEL = 'agent:cancel',
  AGENT_INTERRUPT = 'agent:interrupt',

  // Task
  TASK_GET_CURRENT = 'task:getCurrent',
  TASK_GET_HISTORY = 'task:getHistory',
  TASK_DELETE = 'task:delete',
  TASK_CLEAR_HISTORY = 'task:clearHistory',

  // Permission
  PERMISSION_REQUEST = 'permission:request',
  PERMISSION_RESPOND = 'permission:respond',
  PERMISSION_GET_RULES = 'permission:getRules',
  PERMISSION_SET_RULE = 'permission:setRule',

  // Config
  CONFIG_GET = 'config:get',
  CONFIG_SET = 'config:set',
  CONFIG_RESET = 'config:reset',

  // Memory
  MEMORY_GET_ALL = 'memory:getAll',
  MEMORY_SEARCH = 'memory:search',
  MEMORY_ADD = 'memory:add',
  MEMORY_UPDATE = 'memory:update',
  MEMORY_DELETE = 'memory:delete',
  MEMORY_CLEAR = 'memory:clear',

  // System
  SYSTEM_GET_INFO = 'system:getInfo',
  SYSTEM_OPEN_EXTERNAL = 'system:openExternal',
  SYSTEM_GET_APP_PATH = 'system:getAppPath',

  // Tray
  TRAY_UPDATE = 'tray:update',
}

/** IPC message wrapper */
export interface IpcMessage<T = unknown> {
  channel: IpcChannel;
  requestId: string;
  payload: T;
}

/** IPC response wrapper */
export interface IpcResponse<T = unknown> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: string;
}
