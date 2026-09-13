import { create } from 'zustand';

interface AgentState {
  currentTask: Record<string, unknown> | null;
  messages: Array<{ role: string; content: string; timestamp: number }>;
  agentState: string;
  steps: Array<Record<string, unknown>>;
  permissionRequest: Record<string, unknown> | null;
  streaming: string;

  sendMessage: (message: string) => void;
  setPermissionRequest: (request: Record<string, unknown>) => void;
  respondToPermission: (requestId: string, decision: string) => void;
  addMessage: (role: string, content: string) => void;
  setAgentState: (state: string) => void;
  addStep: (step: Record<string, unknown>) => void;
  setStreaming: (content: string) => void;
  appendStreaming: (content: string) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  currentTask: null,
  messages: [],
  agentState: 'idle',
  steps: [],
  permissionRequest: null,
  streaming: '',

  sendMessage: (message: string) => {
    set((state) => ({
      messages: [...state.messages, { role: 'user', content: message, timestamp: Date.now() }],
      agentState: 'thinking',
      steps: [],
      streaming: '',
    }));

    const api = (window as unknown as { lumaAPI?: { sendMessage?: (msg: string) => Promise<unknown> } }).lumaAPI;
    if (api?.sendMessage) {
      api.sendMessage(message).then((task) => {
        if (task) {
          set({ currentTask: task as Record<string, unknown> });
        }
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        set((state) => ({
          messages: [...state.messages, { role: 'assistant', content: `错误: ${msg}`, timestamp: Date.now() }],
          agentState: 'error',
          streaming: '',
        }));
      });
    } else {
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: '请先在设置中配置 AI 模型。', timestamp: Date.now() }],
        agentState: 'idle',
      }));
    }
  },

  setPermissionRequest: (request) => set({ permissionRequest: request }),

  respondToPermission: (requestId: string, decision: string) => {
    const api = (window as unknown as { lumaAPI?: { respondToPermission?: (id: string, d: string) => void } }).lumaAPI;
    if (api?.respondToPermission) {
      api.respondToPermission(requestId, decision);
    }
    set({ permissionRequest: null, agentState: 'thinking' });
  },

  addMessage: (role: string, content: string) =>
    set((state) => ({
      messages: [...state.messages, { role, content, timestamp: Date.now() }],
    })),

  setAgentState: (state: string) => set({ agentState: state }),

  addStep: (step) =>
    set((state) => ({ steps: [...state.steps, step] })),

  setStreaming: (content: string) => set({ streaming: content }),
  appendStreaming: (content: string) =>
    set((state) => ({ streaming: state.streaming + content })),

  reset: () => set({
    currentTask: null,
    messages: [],
    agentState: 'idle',
    steps: [],
    permissionRequest: null,
    streaming: '',
  }),
}));
