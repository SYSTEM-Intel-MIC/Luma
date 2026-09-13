import React, { useState, useCallback, useEffect } from 'react';
import { FloatingUI } from './components/FloatingUI/FloatingUI.js';
import { ChatView } from './components/Chat/ChatView.js';
import { PermissionDialog } from './components/Permission/PermissionDialog.js';
import { SettingsView } from './components/Settings/SettingsView.js';
import { useAgentStore } from './hooks/useAgentStore.js';

type View = 'idle' | 'chat' | 'settings' | 'permission';

interface AgentEvent {
  type: 'state' | 'step' | 'stream' | 'permission_request' | 'complete' | 'error';
  data: unknown;
}

export function App(): React.JSX.Element {
  const [view, setView] = useState<View>('idle');
  const { currentTask, permissionRequest } = useAgentStore();

  const handleSendMessage = useCallback((message: string) => {
    setView('chat');
    useAgentStore.getState().sendMessage(message);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setView('settings');
  }, []);

  const handleBack = useCallback(() => {
    setView('idle');
  }, []);

  const handleSettingsBack = useCallback(() => {
    const hasMessages = useAgentStore.getState().messages.length > 0;
    setView(hasMessages ? 'chat' : 'idle');
  }, []);

  // Listen for agent events from main process
  useEffect(() => {
    const api = (window as unknown as {
      lumaAPI?: {
        onAgentEvent?: (cb: (event: AgentEvent) => void) => void;
        onPermissionRequest?: (cb: (req: unknown) => void) => void;
      };
    }).lumaAPI;

    if (api?.onAgentEvent) {
      api.onAgentEvent((event: AgentEvent) => {
        const store = useAgentStore.getState();
        switch (event.type) {
          case 'state': {
            const d = event.data as { state: string; taskId?: string };
            store.setAgentState(d.state);
            break;
          }
          case 'step': {
            const step = event.data as Record<string, unknown>;
            // Replace existing step with same id, or add new
            const steps = useAgentStore.getState().steps;
            const idx = steps.findIndex((s) => s.id === step.id);
            if (idx >= 0) {
              const newSteps = [...steps];
              newSteps[idx] = step;
              useAgentStore.setState({ steps: newSteps });
            } else {
              store.addStep(step);
            }
            break;
          }
          case 'stream': {
            const d = event.data as { content: string };
            store.setStreaming(d.content);
            break;
          }
          case 'complete': {
            const d = event.data as { result: string };
            store.setAgentState('completed');
            store.setStreaming('');
            if (d.result) {
              store.addMessage('assistant', d.result);
            }
            break;
          }
          case 'error': {
            const d = event.data as { error: string };
            store.setAgentState('failed');
            store.setStreaming('');
            store.addMessage('assistant', `错误: ${d.error}`);
            break;
          }
          case 'permission_request': {
            store.setPermissionRequest(event.data as Record<string, unknown>);
            break;
          }
        }
      });
    }

    if (api?.onPermissionRequest) {
      api.onPermissionRequest((request: unknown) => {
        useAgentStore.getState().setPermissionRequest(request as Record<string, unknown>);
        setView('permission');
      });
    }
  }, []);

  // Auto-switch to chat when a permission request arrives during idle
  useEffect(() => {
    if (permissionRequest && view === 'idle') {
      setView('permission');
    }
  }, [permissionRequest, view]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', borderRadius: 'var(--radius)' }}>
      {view === 'idle' && (
        <FloatingUI
          onSendMessage={handleSendMessage}
          onOpenSettings={handleOpenSettings}
        />
      )}
      {view === 'chat' && (
        <ChatView
          task={currentTask}
          onBack={handleBack}
          onOpenSettings={handleOpenSettings}
        />
      )}
      {view === 'settings' && (
        <SettingsView onBack={handleSettingsBack} />
      )}
      {view === 'permission' && permissionRequest && (
        <PermissionDialog
          request={permissionRequest}
          onRespond={(decision: string) => {
            useAgentStore.getState().respondToPermission(permissionRequest.id as string, decision);
            setView('chat');
          }}
        />
      )}
    </div>
  );
}
